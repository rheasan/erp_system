use serde::{Deserialize, Serialize};
use uuid;

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

pub struct Ticket {
	pub owner_id: uuid::Uuid,
	pub current_user_id: uuid::Uuid,
	process_id: String,
	current_step: u32,
	log_id: uuid::Uuid,
	is_public: bool,
	created_at: chrono::DateTime<chrono::Utc>,
	updated_at: chrono::DateTime<chrono::Utc>
}