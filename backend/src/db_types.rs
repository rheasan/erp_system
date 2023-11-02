use serde::{Deserialize, Serialize};
use uuid;
use sqlx::FromRow;

#[derive(Serialize, Deserialize)]
pub struct User {
	pub userid: uuid::Uuid,
	pub username: String,
	pub email: Option<String>,
}

pub struct RoleDef {
	pub role_: String
}

pub struct ProcessDef {
	pub process_id: String,
	pub allowed_roles: Vec<String> 
}

pub struct Role {
	pub userid: uuid::Uuid,
	pub role_: String,
}

#[derive(Clone, Serialize, Deserialize, FromRow, Debug)]
pub struct Ticket {
	pub id: i32,
	pub owner_id: uuid::Uuid,
	pub current_user_id: uuid::Uuid,
	pub process_id: String,
	pub current_step: i32,
	pub log_id: uuid::Uuid,
	pub is_public: bool,
	pub created_at: chrono::DateTime<chrono::Utc>,
	pub updated_at: chrono::DateTime<chrono::Utc>,
	pub status: String,
}

impl Ticket {
	pub fn update(&mut self) {
		self.current_step = self.current_step + 1;
		self.updated_at = chrono::Utc::now();
	}
}