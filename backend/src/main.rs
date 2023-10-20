use axum::{routing::{get, post}, Router};
use std::net::SocketAddr;
use sqlx::postgres::PgPoolOptions;

pub mod process;
pub mod users;
pub mod roles;
pub mod db_types;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
	let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
	let port = port.parse::<u16>().unwrap();

	let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not defined");

	let pool = PgPoolOptions::new()
		.max_connections(5)
		.connect(&db_url)
		.await
		.expect("Unable to connect to db");

    let app = Router::new()
		.route("/", get(say_hello))
		.route("/process", get(process::get_processes))
		.route("/process", post(process::create_process))
		.route("/users", post(users::create_user))
		.route("/roles", post(roles::create_role))
		.with_state(pool);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("Running on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();

    Ok(())
}

async fn say_hello() -> &'static str {
    "Hello, world!"
}