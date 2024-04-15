use std::{collections::HashMap, net::SocketAddr};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use tokio::net::TcpStream;
use once_cell::sync::Lazy;
use tokio::io::AsyncWriteExt;
use crate::{logger::{admin_logger, LogType}, ticket::ExecuteErr, utils::make_task_payload};




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

pub async fn send_task(ticket_id: i32, cur_node: i32, payload: &Option<Map<String, Value>>, callbacks: &Vec<Callback>) {
	let header_bytes = 1u64.to_le_bytes();

	let conn = TcpStream::connect(*CALLBACK_ADDR).await;
	if let Err(ref e) = conn {
		let _ = admin_logger(LogType::FailedToPing, &format!("Failed to ping callback server. e: {}", e), None)
			.map_err(|_e| ExecuteErr::FailedToLog);
	}

	let mut conn = conn.unwrap();
	let res = conn.write(&header_bytes).await;
	
	if let Err(ref e) = res {
		let _ = admin_logger(LogType::FailedToPing, &format!("Failed to send header to callback server. e: {}", e), None)
			.map_err(|_e| ExecuteErr::FailedToLog);
	}	


	let serialized_callbacks = serde_json::to_string(callbacks).unwrap();
	let task_payload = make_task_payload(ticket_id, cur_node, payload);
	
	// FIXME: : The connection might break at this stage...
	
	// send data for the callbacks
	let _ = conn.write(&(task_payload.len() as u64).to_le_bytes()).await;
	let _ = conn.write(&task_payload.as_bytes()).await;
	
	// send callbacks
	let _ = conn.write(&(serialized_callbacks.len() as u64).to_le_bytes()).await;
	let _ = conn.write(&serialized_callbacks.as_bytes()).await;

}




