use axum::{http::StatusCode, Json, extract};
use serde::Deserialize;
use sqlx::{PgPool, QueryBuilder, Postgres};
use uuid::Uuid;
use crate::db_types::{User, Role};


#[derive(Deserialize)]
pub struct CreateUser {
	username: String,
	email: Option<String>,
	roles: Vec<String>	
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