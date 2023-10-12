use axum::{routing::get, Router};
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    let app = Router::new().route("/", get(say_hello));
    let addr = SocketAddr::from(([127, 0, 0, 1], 8000));
    println!("Running on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn say_hello() -> &'static str {
    "Hello, world!"
}