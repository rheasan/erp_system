use std::net::SocketAddr;
use axum::{extract, Json};
use axum::http::StatusCode;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use tokio::io::AsyncWriteExt;
use tokio::net::TcpStream;
use uuid::Uuid;
use crate::logger::{LogType, admin_logger};
use crate::ticket::ExecuteErr::{self, FailedToNotify, FailedToLog};
use crate::utils;

#[derive(PartialEq, Eq)]
pub enum Ping {CollectNew, Clear, ClientIdTransfer}

#[derive(Serialize, Deserialize)]
pub struct TokenRequest {
	userid: Uuid 
}
#[derive(Serialize, Deserialize)]
pub struct TokenResponse {
	token: String
}


static NOTIF_ADDR : Lazy<SocketAddr> = Lazy::new(|| {
	let notifier_port = std::env::var("NOTIFIER_PORT").unwrap()
		.parse::<u16>().unwrap();
	return SocketAddr::from(([127, 0, 0, 1], notifier_port));
});

pub async fn ping_notifier(type_: Ping, data: Option<String>) -> Result<(), ExecuteErr> {
	let bytes = match type_ {
		Ping::CollectNew => 1u64.to_le_bytes(),
		Ping::Clear => 2u64.to_le_bytes(),
		Ping::ClientIdTransfer => 3u64.to_le_bytes()
	};

	let conn = TcpStream::connect(*NOTIF_ADDR).await;

	if let Err(e) = conn {
		admin_logger(&LogType::FailedToPing, &format!("Failed to ping notifier server. e: {}", e), None)
			.map_err(|_e| FailedToLog)?;
		return Err(FailedToNotify);
	}

	let mut conn = conn.unwrap();

	let res = conn.write(&bytes).await;

	if let Err(e) = res {
		admin_logger(&LogType::FailedToPing, &format!("Failed to write to socket. e: {}", e), None)
			.map_err(|_e| FailedToLog)?;
		return Err(FailedToNotify);
	}

	if type_ == Ping::ClientIdTransfer {
		// send the client id to the notifier
		let data = data.unwrap();
		let bytes = data.as_bytes();
		let res = conn.write(&bytes).await;

		if let Err(e) = res {
			admin_logger(&LogType::FailedToPing, &format!("Failed to write data to socket after successful ping. e: {}", e), None)
				.map_err(|_e| FailedToLog)?;
			return Err(FailedToNotify);
		}
	}

	return Ok(());
}

pub async fn gen_token(
	extract::Json(req) : extract::Json<TokenRequest>
) -> Result<Json<TokenResponse>, StatusCode> {
	let userid = req.userid;

	let token = utils::gen_random_token(&userid);

	// tell notifier about this token
	if let Err(_) = ping_notifier(Ping::ClientIdTransfer, Some(token.clone())).await {
		admin_logger(&LogType::FailedToPing, &format!("Failed to send client token to notifier. userid: {}.", userid), None)
			.map_err(|_e| StatusCode::INTERNAL_SERVER_ERROR)?;
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}

	return Ok(Json(TokenResponse { token }));
}