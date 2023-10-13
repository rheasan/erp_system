use axum::{routing::{get, post}, Router};
use std::net::SocketAddr;

pub mod process;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {

    let app = Router::new()
    .route("/", get(say_hello))
    .route("/process", get(process::get_processes))
    .route("/process", post(process::create_process));

    let addr = SocketAddr::from(([127, 0, 0, 1], 8000));
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