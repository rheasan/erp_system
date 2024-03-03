use std::io::Write;
use std::path::PathBuf;

use axum::http::StatusCode;

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
	FailedToPing
}

fn public_logger(type_: &LogType, data: &String, log_id: &uuid::Uuid) -> Result<(), std::io::Error>  {

	let data_dir = std::env::var("PROCESS_DATA_PATH").expect("PROCESS_DATA_PATH not defined");
	let log_file_path = PathBuf::from(data_dir).join("public_logs").join(log_id.to_string());
	let mut log_file = std::fs::OpenOptions::new()
		.append(true)
		.create(true)
		.open(log_file_path)?;

	let log_type = match type_ {
		LogType::Approval => "APPROVAL",
		LogType::Rejection => "REJECTION",
		LogType::UploadSuccess => "UPLOAD_SUCCESS",
		LogType::Request => "REQUEST",
		LogType::Completion => "COMPLETION",
		LogType::Info => "INFO",
		LogType::NotificationSuccess => "NOTIFICATION_SUCCESS",
		_ => unreachable!()
	};

	let log = format!("[{}] [{}] {}\n", log_type, chrono::Local::now().to_rfc3339(), data);
	log_file.write_all(log.as_bytes())?;

	Ok(())
}

pub fn admin_logger(type_: &LogType, data: &String, log_id: Option<&uuid::Uuid>) -> Result<(), std::io::Error>  {

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

	let mut log_file = std::fs::OpenOptions::new()
		.append(true)
		.create(true)
		.open(log_file_path)?;

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
		LogType::NotificationSuccess => "NOTIFICATION_SUCCESS"
	};

	let log = format!("[{}] [{}] {}\n", log_type, chrono::Local::now().to_rfc3339(), data);
	log_file.write_all(log.as_bytes())?;

	Ok(())
}

pub fn log(type_: LogType, data: String, log_id: uuid::Uuid) -> Result<(), StatusCode> {
	match type_ {
		LogType::Approval | LogType::Rejection | LogType::UploadSuccess | LogType::Request | 
		LogType::Completion | LogType::Info | LogType::NotificationSuccess => {
			public_logger(&type_, &data, &log_id).map_err(|e| {
				eprintln!("Unable to write to log file: {}, log_id: {}", e, log_id);
				return StatusCode::INTERNAL_SERVER_ERROR;
			})?;
			admin_logger(&type_, &data, Some(&log_id)).map_err(|e| {
				eprintln!("Unable to write to log file: {}, log_id: {}", e, log_id);
				return StatusCode::INTERNAL_SERVER_ERROR;
			})?;
		},
		_ => {
			admin_logger(&type_, &data, Some(&log_id)).map_err(|e| {
				eprintln!("Unable to write to log file: {}, log_id: {}", e, log_id);
				return StatusCode::INTERNAL_SERVER_ERROR;
			})?;
		}
	}
	Ok(())
}