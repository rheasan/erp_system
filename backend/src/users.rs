use axum::{http::StatusCode, Json, extract};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, QueryBuilder, Postgres};

#[derive(Deserialize)]
pub struct CreateUser {
	username: String,
}
#[derive(Deserialize, sqlx::FromRow, Clone, Serialize)]
pub struct NewUser {
	username: String,
	roles: String,
	email: String
}

#[derive(Deserialize)]
// TODO: roles should be an array that is added directly to the new_users table after verification of roles
pub struct RegisterNewUser {
	username: String,
	roles: String,
	email: String,
}
#[derive(Deserialize)]
pub struct CheckUserApproved {
	username: String
}
#[derive(sqlx::FromRow, Debug)]
pub struct CountQuery {
	count: i64
}


#[derive(Serialize)]
pub struct UserApprovedMsg {
	pub status: bool
}
#[derive(Deserialize)]
pub struct IsAdminReq {
	username: String,
}
#[derive(Serialize)]
pub struct IsAdminRes {
	value: bool 
}

impl UserApprovedMsg {
	fn get(status: bool) -> UserApprovedMsg {
		return UserApprovedMsg {
			status
		};
	}
}


pub async fn create_user(
	extract::State(pool) : extract::State<PgPool>,
	Json(payload) : Json<CreateUser>
) -> Result<StatusCode, StatusCode> {
	let mut tx = pool.begin().await.unwrap();
	let username = payload.username;

	// get the userdata from new_users
	let new_user_query : Result<Vec<NewUser>, _> = sqlx::query_as("select * from new_users where username=$1")
		.bind(&username)
		// TODO: why is tx dereferenced ?????????
		.fetch_all(&mut *tx)
		.await;

	if let Err(e) = new_user_query {
		eprintln!("Failed to get existing user data at create_user, username: {}, e: {}", username, e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}

	let new_user = new_user_query.unwrap()[0].clone();

	// insert the new_user into users table
	let userid = uuid::Uuid::new_v4();

	let insert_into_user = 
		sqlx::query("insert into users (userid, username, email) values ($1, $2, $3)")
		.bind(&userid)
		.bind(&new_user.username)
		.bind(&new_user.email)
		.execute(&mut *tx)
		.await;

	if let Err(e) = insert_into_user {
		eprintln!("Error inserting into user: {}", e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}
	
	// insert roles
	// verify correct roles
	let roles = new_user.roles.split(",").map(|r| r.trim()).collect::<Vec<_>>();
	let role_query : Result<Vec<CountQuery>, _> = sqlx::query_as("select count(*) from role_defs where role_ in (select * from unnest($1::varchar[]))")
		.bind(&roles)
		.fetch_all(&mut *tx)
		.await;

	if let Err(e) = role_query {
		eprintln!("Error in register_new_user in role_checking: {}", e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}

	let role_query = role_query.unwrap();
	
	if role_query[0].count != roles.len() as i64 {
		eprintln!("Error in create_new_user. Request contains non-existing roles: username: {}", username);
		return Err(StatusCode::CONFLICT);
	}

	// !!!! look at the trailing space
	let mut role_query_builder : QueryBuilder<Postgres> = QueryBuilder::new("insert into roles (userid, role_) ");
	let insert_roles_query = 
		role_query_builder.
		push_values(roles.iter(), |mut b, role| {
			b.push_bind(&userid)
			.push_bind(role);
		})
		.build();

	if let Err(e) = insert_roles_query.execute(&mut *tx).await {
		eprintln!("Error inserting roles in create_user: {}", e);
		return Err(StatusCode::CONFLICT);
	}

	// remove user from new_users
	let query = sqlx::query("delete from new_users where username=$1")
		.bind(&username)
		.execute(&mut *tx)
		.await;

	if let Err(e) = query {
		eprintln!("Error removing user from new_users. username: {}, e: {}", username, e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}
	let result = tx.commit().await;
	if let Err(e) = result {
		eprintln!("failed to commit transaction in create_user, username: {}, e: {}", username, e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}
	return Ok(StatusCode::CREATED);
}

pub async fn register_new_user(
	extract::State(pool) : extract::State<PgPool>,
	Json(payload) : Json<RegisterNewUser>
) -> Result<StatusCode, StatusCode> {
	let username = payload.username;
	let roles = payload.roles;
	let email = payload.email;

	// check if the user has already registered;
	let check_user_query : Result<Vec<CountQuery>, _> = sqlx::query_as("select count(*) from (select un.username from new_users un where username=$1 union select u.username from users u where username=$2) all_users")
		.bind(&username)
		.bind(&username)
		.fetch_all(&pool)
		.await;

	if let Err(e) = check_user_query {
		eprintln!("Error in register_new_user, username: {}, : {}", username, e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}

	let check_user_query = check_user_query.unwrap();

	if check_user_query[0].count != 0 {
		eprintln!("Error in register_new_user, username: {}", username);
		return Err(StatusCode::CONFLICT);
	}

	// insert into new_users
	let query = sqlx::query("insert into new_users (username, roles, email) values ($1, $2, $3)")
		.bind(&username)
		.bind(&roles)
		.bind(&email)
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
	payload : extract::Query<CheckUserApproved>
) -> Result<(StatusCode, Json<UserApprovedMsg>), StatusCode> {

	let username = payload.0.username;
	let query : Result<Vec<CountQuery>, _> = sqlx::query_as("select count(*) from new_users where username=$1")
		.bind(&username)
		.fetch_all(&pool)
		.await;

	if let Err(e) = query {
		eprintln!("Error checking new user status: {}", e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}
	let query = query.unwrap();
	if query[0].count == 0 {
		return Ok((StatusCode::OK, Json(UserApprovedMsg::get(true))));
	}	

	return Ok((StatusCode::OK, Json(UserApprovedMsg::get(false))));
}

pub async fn is_admin(
	payload : extract::Query<IsAdminReq>,
	extract::State(pool) : extract::State<PgPool>
) -> Result<(StatusCode, Json<IsAdminRes>), StatusCode> {

	let username = payload.0.username;
	let query = sqlx::query("select role_ from users u join roles r on u.userid = r.userid where u.username=$1 and role_='admin'")
		.bind(&username)
		.fetch_all(&pool)
		.await;

	if let Err(e) = query {
		eprintln!("Error in is_admin: {}", e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}
	
	let query = query.unwrap();

	// query should only return 0 or 1 results. you cant add same role twice for same user.
	if query.len() == 1 {
		return Ok((StatusCode::OK, Json(IsAdminRes {value: true})));
	}

	return Ok((StatusCode::OK, Json(IsAdminRes { value: false })));
}

pub async fn get_all_new_users(
	extract::State(pool) : extract::State<PgPool>
) -> Result<(StatusCode, Json<Vec<NewUser>>), StatusCode> {

	let query : Result<Vec<NewUser>, _> = sqlx::query_as("select * from new_users")
		.fetch_all(&pool)
		.await;

	if let Err(e) = query {
		eprintln!("Error fetching new users at get_all_new_users. e: {}", e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}

	let query = query.unwrap();
	return Ok((StatusCode::OK, Json(query)));
}