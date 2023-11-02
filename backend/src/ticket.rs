use axum::{Json, http::StatusCode, extract};
use serde::{Serialize, Deserialize};
use sqlx::{FromRow, Postgres, Transaction};
use crate::{db_types::Ticket, process::read_process_data};
use std::collections::HashMap;

pub enum Event {Initiate, Send, Complete}
pub enum TicketStatus {Open, Closed, Rejected}
#[derive(Debug)]
pub enum ExecuteErr {InvalidTicket, FailedToExecute, InvalidEvent, FailedToReadProcessData}
#[derive(Serialize, Deserialize)]
pub struct CreateTicket {
	pub process_id: String,
	pub owner_id: uuid::Uuid,
	pub is_public: bool
}

#[derive(Serialize, Deserialize)]
pub struct UpdateTicket {
	pub ticket_id: i32,
	pub	status: bool,
}
#[derive(Serialize, Deserialize, FromRow)]
pub struct UserIdQueryRes {
	userid: uuid::Uuid
}


pub async fn create_ticket(
	extract::State(pool): extract::State<sqlx::PgPool>,
	Json(payload) : Json<CreateTicket>
) -> Result<StatusCode, StatusCode> {
	let query = sqlx::query("insert into tickets (owner_id, current_user_id, process_id, current_step, log_id, is_public, created_at, updated_at, status) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)")
		.bind(&payload.owner_id)
		.bind(&payload.owner_id)
		.bind(&payload.process_id)
		// 0th step is always Event::Initiate
		.bind(1)
		.bind(uuid::Uuid::new_v4())
		.bind(&payload.is_public)
		.bind(chrono::Utc::now())
		.bind(chrono::Utc::now())
		.bind("open")
		.execute(&pool)
		.await;

	if let Err(e) = query {
		eprintln!("Error adding ticket: process {} from {}: {}", payload.process_id, payload.owner_id, e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}

	return Ok(StatusCode::CREATED);
}

#[axum::debug_handler]
pub async fn update_ticket(
	extract::State(pool): extract::State<sqlx::PgPool>,
	Json(payload) : Json<UpdateTicket>,
) -> Result<StatusCode, StatusCode> {
	// if the ticket was rejected then set its status to false and return
	if payload.status == false {
		let query = sqlx::query("update tickets set status = 'rejected' where id = $1")
			.bind(&payload.ticket_id)
			.execute(&pool)
			.await;
		if let Err(e) = query {
			eprintln!("Error updating ticket: {} from db: {}", payload.ticket_id, e);
			return Err(StatusCode::INTERNAL_SERVER_ERROR);
		}
		return Ok(StatusCode::OK);
	}


	let ticket_id = payload.ticket_id; 
	let mut tx = pool.begin().await.unwrap();
	let ticket : Result<Ticket, _> = sqlx::query_as("select * from tickets where id = $1")
		.bind(&ticket_id)
		.fetch_one(&mut *tx)
		.await;

	if let Err(e) = ticket {
		eprintln!("Error reading ticket: {} from db: {}", ticket_id, e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	};
	let mut ticket = ticket.unwrap();
	// if ticket was already rejected or completed then return immediately
	if ticket.status == "rejected" || ticket.status == "complete" {
		return Ok(StatusCode::FORBIDDEN);
	}

	let result = execute(&mut ticket, &mut tx).await;
	if let Err(e) = result {
		eprintln!("Error executing events: {:?} for pid {}", e, ticket.process_id);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}
	let result = match result.unwrap() {
		TicketStatus::Open => "open",
		TicketStatus::Closed => "complete",
		TicketStatus::Rejected => unreachable!()
	};
	// update the ticket with new values;
	// FIXME: this query should be updated when new events are added
	let query = sqlx::query("update tickets set current_user_id = $1, current_step = $2, updated_at = $3, status = $4 where id = $5")
		.bind(&ticket.current_user_id)
		.bind(&ticket.current_step)
		.bind(&ticket.updated_at)
		.bind(result)
		.bind(&ticket.id)
		.execute(&mut *tx)
		.await;

	if let Err(e) = query {
		eprintln!("Error updating ticket: {} from db: {}", ticket_id, e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}

	if let Err(e) = tx.commit().await {
		eprintln!("Error commiting transaction: {} for pid {}", e, ticket.process_id);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}
	return Ok(StatusCode::OK);
}

async fn execute(ticket: &mut Ticket, transaction: &mut Transaction<'_, Postgres>) -> Result<TicketStatus, ExecuteErr>{
	// TODO: this map should have static lifetime
	let mut map : HashMap<&str, Event> = HashMap::new();
	map.insert("initiate", Event::Initiate);
	map.insert("send", Event::Send);
	map.insert("complete", Event::Complete);
	let process_id = ticket.process_id.clone();

	let process_data = read_process_data(process_id.clone());
	if let Err(e) = process_data {
		eprintln!("Error reading process data: {} pid: {}", e, process_id);
		return Err(ExecuteErr::FailedToReadProcessData);
	}
	let process_data = process_data.unwrap();

	if ticket.process_id != process_data.pid {
		return Err(ExecuteErr::InvalidTicket);
	}
	let current_step = ticket.current_step as usize;
	let current_job = process_data.jobs[current_step].clone();
	let event = map.get(&current_job.event[..]);
	if let None = event {
		eprintln!("Invalid event found: {} for pid {}", current_job.event, process_id);
		eprintln!("Should be unreachable!!!!!");
		return Err(ExecuteErr::InvalidEvent);
	}
	let event = event.unwrap();

	match event {
		Event::Initiate => {
			// initiate is 0th step. all tickets start with current step = 0 instead of current step = 1
			unreachable!();
		}
		Event::Send => {
			if current_job.args.is_none() {
				eprintln!("No arguments found for job. Process_id = {}, ticket_id = {}", process_id, ticket.id);
				return Err(ExecuteErr::InvalidTicket);
			}
			let next_user_username = current_job.args.unwrap()[0].clone();
			
			// get userid of next user
			let next_user_query: Result<UserIdQueryRes, sqlx::Error> = sqlx::query_as("select userid from users where username = $1")
				.bind(next_user_username)
				.fetch_one(&mut **transaction)
				.await;

			if let Err(e) = next_user_query {
				eprintln!("Error reading userid from db: {}", e);
				return Err(ExecuteErr::FailedToExecute);
			}

			ticket.current_user_id = next_user_query.unwrap().userid;
			ticket.update();
		}
		Event::Complete => {
			return Ok(TicketStatus::Closed);
		}
	}

	return Ok(TicketStatus::Open);
}