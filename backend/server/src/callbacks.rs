use std::{collections::HashMap, net::SocketAddr};
use serde::{Deserialize, Serialize};
use serde_json::{Value, Map};
use tokio::net::TcpStream;
use once_cell::sync::Lazy;
use tokio::io::AsyncWriteExt;
use crate::{logger::{admin_logger, LogType}, ticket::ExecuteErr};




static CALLBACK_ADDR : Lazy<SocketAddr> = Lazy::new(|| {
	let callback_port = std::env::var("CALLBACK_SERVER_PORT").unwrap()
		.parse::<u16>().unwrap();
	SocketAddr::from(([127, 0, 0, 1], callback_port))
});

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type")]
#[serde(rename_all = "snake_case")]
pub enum Callback {
	// TODO: add more options than just python
	Script {
		name: String,
		path: String,
	},
	Webhook {
		name: String,
		url: String, // should be Uri
		headers: HashMap<String, String>
	}
}
pub enum SignalType {
	SendTask, // 1u64
	RegisterCallback // 2u64
}

pub async fn send_task(data: &Option<serde_json::Value>, callbacks: &Vec<Callback>) {
	let header_bytes = 1u64.to_le_bytes();

	let conn = TcpStream::connect(*CALLBACK_ADDR).await;
	if let Err(ref e) = conn {
		let _ = admin_logger(&LogType::FailedToPing, &format!("Failed to ping callback server. e: {}", e), None)
			.map_err(|_e| ExecuteErr::FailedToLog);
	}

	let mut conn = conn.unwrap();
	let res = conn.write(&header_bytes).await;
	
	if let Err(ref e) = res {
		let _ = admin_logger(&LogType::FailedToPing, &format!("Failed to send header to callback server. e: {}", e), None)
			.map_err(|_e| ExecuteErr::FailedToLog);
	}	


	// None should be serialized to "{}" instead of "null" because if the callback is a webhook then body should be empty object not null 
	let data = data.clone().unwrap_or(Value::Object(Map::new()));
	let serialized_data = serde_json::to_string(&data).unwrap();
	let serialized_callbacks = serde_json::to_string(callbacks).unwrap();
	
	// FIXME: : The connection might break at this stage...
	
	// send data for the callbacks
	let _ = conn.write(&(serialized_data.len() as u64).to_le_bytes()).await;
	let _ = conn.write(&serialized_data.as_bytes()).await;
	
	// send callbacks
	let _ = conn.write(&(serialized_callbacks.len() as u64).to_le_bytes()).await;
	let _ = conn.write(&serialized_callbacks.as_bytes()).await;

}




