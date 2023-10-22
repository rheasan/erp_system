use axum::{http::StatusCode, Json, extract};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, QueryBuilder, Postgres};
use uuid::Uuid;
use crate::db_types::{User, Role};


#[derive(Deserialize)]
pub struct CreateUser {
	username: String,
	email: Option<String>,
	roles: Vec<String>	
}

#[derive(Deserialize)]
pub struct RegisterNewUser {
	username: String,
}

#[derive(Serialize)]
pub struct UserApprovedMsg {
	pub status: bool
}
impl UserApprovedMsg {
	fn get(status: bool) -> UserApprovedMsg {
		return UserApprovedMsg {
			status
		};
	}
}

impl CreateUser {
	fn gen_user_and_roles(&self) -> (User, Vec<Role>) {
		let id = Uuid::new_v4();
		let user = User {
			userid: id,
			username: self.username.clone(),
			email: self.email.clone(),
		};
		let roles = self.roles.iter().map(|r| 
			Role {
				userid: id,
				role_: r.to_string(),
			}
		).collect::<Vec<Role>>();

		return (user, roles);
	}
}

pub async fn create_user(
	extract::State(pool) : extract::State<PgPool>,
	Json(payload) : Json<CreateUser>
) -> Result<(StatusCode, Json<uuid::Uuid>), StatusCode> {
	let (user, roles) = payload.gen_user_and_roles();

	let insert_into_user = 
		sqlx::query("insert into users (userid, username, email) values ($1, $2, $3)")
		.bind(&user.userid)
		.bind(&user.username)
		.bind(&user.email)
		.execute(&pool)
		.await;

	if let Err(e) = insert_into_user {
		eprintln!("Error inserting into user: {}", e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}
	

	// !!!! look at the trailing space
	let mut role_query_builder : QueryBuilder<Postgres> = QueryBuilder::new("insert into roles (userid, role_) ");
	let insert_roles_query = 
		role_query_builder.
		push_values(roles.iter(), |mut b, role| {
			b.push_bind(user.userid)
			.push_bind(role.role_.clone());
		})
		.build();

	if let Err(e) = insert_roles_query.execute(&pool).await {
		eprintln!("Error inserting roles in create_user: {}", e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}

	return Ok((StatusCode::CREATED, Json(user.userid)));
}

pub async fn register_new_user(
	extract::State(pool) : extract::State<PgPool>,
	Json(payload) : Json<RegisterNewUser>
) -> Result<StatusCode, StatusCode> {
	let username = payload.username;
	let query = sqlx::query("insert into new_users values ($1)")
		.bind(&username)
		.execute(&pool)
		.await;

	if let Err(e) = query {
		eprintln!("Error registering new user: {}", e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}

	return Ok(StatusCode::OK);
}


pub async fn check_user_approved(
	extract::State(pool) : extract::State<PgPool>,
	payload : extract::Query<RegisterNewUser>
) -> Result<(StatusCode, Json<UserApprovedMsg>), StatusCode> {

	let username = payload.0.username;
	let query = sqlx::query("select * from new_users where username=$1")
		.bind(&username)
		.fetch_all(&pool)
		.await;

	if let Err(e) = query {
		eprintln!("Error checking new user status: {}", e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}
	let query = query.unwrap();
	if query.len() == 0 {
		return Ok((StatusCode::OK, Json(UserApprovedMsg::get(true))));
	}

	return Ok((StatusCode::OK, Json(UserApprovedMsg::get(false))));
}