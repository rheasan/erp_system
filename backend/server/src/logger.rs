use std::io::Write;
use std::path::PathBuf;

use axum::http::StatusCode;

#[derive(Copy, Clone)]
pub enum LogType {
	Info,
	Approval,
	UploadSuccess,
	Rejection,
	Request,
	NotificationSuccess,
	Warning,
	Error,
	Completion,
	FailedToPing,
	FailedToSendTask
}

fn public_logger(type_: LogType, data: &String, log_id: &uuid::Uuid) -> Result<(), std::io::Error>  {

	let data_dir = std::env::var("PROCESS_DATA_PATH").expect("PROCESS_DATA_PATH not defined");
	let log_file_path = PathBuf::from(data_dir).join("public_logs").join(log_id.to_string());

	// FIXME: Assume all io errors are fatal. maybe not a good idea?
	tokio::spawn({
		let data = data.clone();
		async move {
			let log_file = std::fs::OpenOptions::new()
				.append(true)
				.create(true)
				.open(&log_file_path);

			if let Err(e) = log_file {
				panic!("[FATAL] [{}] Failed to open log_file (public_logger): File: {:?}, e: {}", chrono::Local::now(), log_file_path, e);
			}
			let mut log_file = log_file.unwrap();

			let log_type = match type_ {
				LogType::Approval => "APPROVAL",
				LogType::Rejection => "REJECTION",
				LogType::UploadSuccess => "UPLOAD_SUCCESS",
				LogType::Request => "REQUEST",
				LogType::Completion => "COMPLETION",
				LogType::Info => "INFO",
				LogType::NotificationSuccess => "NOTIFICATION_SUCCESS",
				LogType::FailedToSendTask => "FAILED_TO_SEND_TASK",
				_ => unreachable!()
			};

			let log = format!("[{}] [{}] {}\n", log_type, chrono::Local::now().to_rfc3339(), data);
			if let Err(e) =  log_file.write_all(log.as_bytes()) {
				panic!("[FATAL] [{}] Failed to write to log_file. (public_logger): File: {:?}, e: {}", chrono::Local::now(), log_file_path, e);
			}
		}
	});
	
	Ok(())
}

pub fn admin_logger(type_: LogType, data: &String, log_id: Option<&uuid::Uuid>) -> Result<(), std::io::Error>  {

	let data_dir = std::env::var("PROCESS_DATA_PATH").expect("PROCESS_DATA_PATH not defined");
	let mut log_file_path = PathBuf::from(&data_dir).join("admin_logs");

	match log_id {
		Some(id) => {
			log_file_path = log_file_path.join(id.to_string());
		},
		None => {
			log_file_path = log_file_path.join("common_log");
		}
	}

	tokio::spawn({
		let data = data.clone();
		async move {
			let log_file = std::fs::OpenOptions::new()
				.append(true)
				.create(true)
				.open(&log_file_path);

			if let Err(e) = log_file {
				panic!("[FATAL] [{}] Failed to open log_file (admin_logger): File: {:?}, e: {}", chrono::Local::now(), log_file_path, e);
			}

			let mut log_file = log_file.unwrap();

			let log_type = match type_ {
				LogType::Info => "INFO",
				LogType::Warning => "WARNING",
				LogType::Error => "ERROR",
				LogType::Approval => "APPROVAL",
				LogType::Rejection => "REJECTION",
				LogType::UploadSuccess => "UPLOAD_SUCCESS",
				LogType::Request => "REQUEST",
				LogType::Completion => "COMPLETION",
				LogType::FailedToPing => "FAILED_TO_PING",
				LogType::NotificationSuccess => "NOTIFICATION_SUCCESS",
				LogType::FailedToSendTask => "FAILED_TO_SEND_TASK",
			};

			let log = format!("[{}] [{}] {}\n", log_type, chrono::Local::now().to_rfc3339(), data);
			if let Err(e) = log_file.write_all(log.as_bytes()) {
				panic!("[FATAL] [{}] Failed to write to log_file. (admin_logger): File: {:?}, e: {}", chrono::Local::now(), log_file_path, e);
			}
		}
	});
	Ok(())
}

pub fn log(type_: LogType, data: String, log_id: uuid::Uuid) -> Result<(), StatusCode> {
	match type_ {
		LogType::Approval | LogType::Rejection | LogType::UploadSuccess | LogType::Request | 
		LogType::Completion | LogType::Info | LogType::NotificationSuccess | LogType::FailedToSendTask => {
			public_logger(type_, &data, &log_id).map_err(|e| {
				eprintln!("Unable to write to log file: {}, log_id: {}", e, log_id);
				return StatusCode::INTERNAL_SERVER_ERROR;
			})?;
			admin_logger(type_, &data, Some(&log_id)).map_err(|e| {
				eprintln!("Unable to write to log file: {}, log_id: {}", e, log_id);
				return StatusCode::INTERNAL_SERVER_ERROR;
			})?;
		},
		_ => {
			admin_logger(type_, &data, Some(&log_id)).map_err(|e| {
				eprintln!("Unable to write to log file: {}, log_id: {}", e, log_id);
				return StatusCode::INTERNAL_SERVER_ERROR;
			})?;
		}
	}
	Ok(())
}