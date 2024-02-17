use std::net::SocketAddr;
use once_cell::sync::Lazy;
use tokio::io::AsyncWriteExt;
use tokio::net::TcpStream;
use crate::logger::{LogType, admin_logger};
use crate::ticket::ExecuteErr::{self, FailedToNotify, FailedToLog};

pub enum Ping {CollectNew, Clear}


static NOTIF_ADDR : Lazy<SocketAddr> = Lazy::new(|| {
	let notifier_port = std::env::var("NOTIFIER_PORT").unwrap()
		.parse::<u16>().unwrap();
	return SocketAddr::from(([127, 0, 0, 1], notifier_port));
});

pub async fn ping_notifier(type_: Ping) -> Result<(), ExecuteErr> {
	let bytes = match type_ {
		Ping::CollectNew => 1u64.to_le_bytes(),
		Ping::Clear => 2u64.to_le_bytes(),
	};

	let conn = TcpStream::connect(*NOTIF_ADDR).await;

	if let Err(e) = conn {
		admin_logger(&LogType::FailedToPing, &format!("Failed to ping notifier server. e: {}", e), None)
			.map_err(|_e| FailedToLog)?;
		return Err(FailedToNotify);
	}

	let mut conn = conn.unwrap();

	let res = conn.write(&bytes).await;

	if let Err(e) = res {
		admin_logger(&LogType::FailedToPing, &format!("Failed to write to socket. e: {}", e), None)
			.map_err(|_e| FailedToLog)?;
		return Err(FailedToNotify);
	}

	return Ok(());
}
