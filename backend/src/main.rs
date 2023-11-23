use axum::{routing::{get, post}, Router, http::{Method, HeaderValue}};
use std::{net::SocketAddr, path::PathBuf};
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::CorsLayer;
use axum::http::header::CONTENT_TYPE;
use dotenv;

pub mod process;
pub mod users;
pub mod roles;
pub mod db_types;
pub mod ticket;
pub mod utils;
pub mod logger;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {

	dotenv::dotenv().ok();

	// check if the data dir exists or not
	let data_dir = std::env::var("PROCESS_DATA_PATH").expect("PROCESS_DATA_PATH not defined");
	let process_data_dir = PathBuf::from(&data_dir);
	if !process_data_dir.try_exists().unwrap() {
		println!("Process data dir not found. Creating...");
		std::fs::create_dir_all(process_data_dir).unwrap();
	}

	let log_dir = PathBuf::from(&data_dir).join("public_logs");
	if !log_dir.try_exists().unwrap() {
		println!("Public log dir not found. Creating...");
		std::fs::create_dir_all(log_dir).unwrap();
	}

	let admin_log_dir = PathBuf::from(&data_dir).join("admin_logs");
	if !admin_log_dir.try_exists().unwrap() {
		println!("Admin log dir not found. Creating...");
		std::fs::create_dir_all(&admin_log_dir).unwrap();
	}



	let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
	let port = port.parse::<u16>().unwrap();

	let cors = CorsLayer::new()
		.allow_headers([CONTENT_TYPE])
		.allow_methods([Method::GET, Method::POST])
		.allow_origin(std::env::var("FRONTEND_URL")?.parse::<HeaderValue>().unwrap());

	let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not defined");

	let pool = PgPoolOptions::new()
		.max_connections(5)
		.connect(&db_url)
		.await
		.expect("Unable to connect to db");

    let app = Router::new()
		.route("/", get(say_hello))
		.route("/get_all_processes", get(process::get_all_processes))
		.route("/process", post(process::create_process))
		.route("/users", post(users::create_user))
		.route("/get_userid", get(users::get_userid))
		.route("/is_admin", get(users::is_admin))
		.route("/roles", post(roles::create_role))
		.route("/get_all_roles", get(roles::get_all_roles))
		.route("/new_user", post(users::register_new_user))
		.route("/new_user", get(users::get_all_new_users))
		.route("/new_user_approved", get(users::check_user_approved))
		.route("/ticket", post(ticket::create_ticket))
		.route("/get_user_tickets", get(ticket::get_user_tickets))
		.route("/update_ticket", post(ticket::update_ticket))
		.layer(cors)
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