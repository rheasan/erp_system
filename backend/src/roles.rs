use serde::Deserialize;
use axum::{http::StatusCode, extract, Json};
use sqlx::PgPool;


#[derive(Deserialize)]
pub struct CreateRole {
	role_: String
}

pub async fn create_role(
	extract::State(pool) : extract::State<PgPool>,
	Json(payload) : Json<CreateRole>
) -> Result<StatusCode, StatusCode> {

	let role = payload.role_;
	let insert_into_role = 
		sqlx::query("insert into role_defs (role_) values ($1)")
		.bind(role)
		.execute(&pool)
		.await;

	if let Err(e) = insert_into_role {
		eprint!("Error insert into role_defs: {}", e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}

	return Ok(StatusCode::CREATED);
}