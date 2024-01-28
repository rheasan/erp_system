use axum::{
    Json,
    http::StatusCode,
	extract
};
use once_cell::sync::Lazy;
use serde::{Serialize, Deserialize};
use sqlx::{PgPool, FromRow};
use std::path::PathBuf;
use crate::logger::{LogType, admin_logger};

#[derive(Serialize, Deserialize, Clone)]
pub struct Process {
    pub pname: String,
    pub pid: String,
    pub steps: Vec<Job>,
    pub desc: Option<String>,
	pub roles: Vec<String>,
}

#[derive(Serialize, Deserialize, FromRow)]
pub struct ProcessGetResponse {
	pub process_id: String,
	pub description: Option<String>,
}

#[derive(Deserialize)]
pub struct ProcessDataQuery {
	pub process_id: String
}

#[derive(Serialize)]
pub struct ProcessDataResponse {
	pub active: bool,
	pub description: Option<String> 
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Job {
    pub event: String,
    pub args : Option<Vec<String>>,
	pub next: Vec<i32>,
	pub required: Vec<i32>
}

static CONFIG_DIR: Lazy<PathBuf> = Lazy::new(|| {
	let path = PathBuf::from(std::env::var("PROCESS_DATA_PATH").unwrap());
	println!("Config dir initialized to : {:?}", path.as_os_str());
	return path;
});


pub fn read_process_data(pid: String) -> Result<Process, std::io::Error> {
	let data_path = CONFIG_DIR.join(format!("{}.json", pid));
    let process_data = std::fs::read_to_string(data_path)?;
    let parsed_data = serde_json::from_str::<Process>(&process_data)?;

    return Ok(parsed_data);
}

fn save_process_data(data: &Process) -> Result<(), std::io::Error> {
	let pid = data.pid.clone();

	let data_path = CONFIG_DIR.join(format!("{}.json", pid));
    let serialized = serde_json::to_string::<Process>(data).unwrap();

    std::fs::write(data_path, serialized)?;
    return Ok(());
}

// TODO: only return processes that the user has access to
pub async fn get_all_processes(
	extract::State(pool) : extract::State<PgPool>
) -> Result<Json<Vec<ProcessGetResponse>>, StatusCode> {

	let query = sqlx::query_as("select process_id, description from process_defs")
		.fetch_all(&pool)
		.await;

	if let Err(e) = query {
		admin_logger(&LogType::Error, &format!("Error fetching process names: {}", e), None)
			.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}

	let processes = query.unwrap();

	return Ok(Json(processes));
}

pub async fn create_process(
	extract::State(pool) : extract::State<PgPool>,
    Json(payload) : Json<Process>,
) -> Result<StatusCode, StatusCode> {
	let pid = payload.pid.clone();

	let config_path = CONFIG_DIR.join(format!("{}.json", pid));
	match config_path.try_exists() {
		Err(e) => {
			admin_logger(&LogType::Error, &format!("Error reading saved process data: {}", e), None)
				.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
			return Err(StatusCode::INTERNAL_SERVER_ERROR);
		}
		Ok(true) => {
			admin_logger(&LogType::Error, &format!("Process with pid {} already exists", pid), None)
				.map_err(|_| StatusCode::FORBIDDEN)?;
			return Err(StatusCode::FORBIDDEN);
		}
		Ok(false) => {
			{};
		}
	}
	let mut tx = pool.begin().await.unwrap();

    

	let query = sqlx::query("insert into process_defs (process_id, allowed_roles, description) values ($1, $2, $3)")
		.bind(&payload.pid)
		.bind(&payload.roles)
		.bind(&payload.desc)
		.execute(&mut *tx)
		.await;

	if let Err(e) = query {
		admin_logger(&LogType::Error, &format!("Error inserting new process: {} for pid {}", e, payload.pid), None)
			.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}

	if let Err(e) = save_process_data(&payload) {
        admin_logger(&LogType::Error, &format!("Error saving new process data: {}", e), None)
			.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

	let result = tx.commit().await;
	if let Err(e) = result {
		admin_logger(&LogType::Error, &format!("Error commiting transaction: {} for pid {}", e, payload.pid), None)
			.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
		std::fs::remove_file(config_path).unwrap();
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}

	admin_logger(&LogType::Info, &format!("Process {} created successfully", payload.pid), None)
		.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    return Ok(StatusCode::CREATED);
}

pub async fn get_process_data(
	extract::Query(query) : extract::Query<ProcessDataQuery>
) -> Result<Json<ProcessDataResponse>, StatusCode> {
	let pid = query.process_id;

	let mut result = ProcessDataResponse {
		active: false,
		description: None
	};

	let config_path = CONFIG_DIR.join(format!("{}.json", pid));
	match config_path.try_exists() {
		Err(e) => {
			admin_logger(&LogType::Error, &format!("Error reading saved process data: {}", e), None)
				.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
			return Err(StatusCode::INTERNAL_SERVER_ERROR);
		}
		Ok(false) => {
			admin_logger(&LogType::Error, &format!("Process with pid {} does not exist", pid), None)
				.map_err(|_| StatusCode::NOT_FOUND)?;
			return Err(StatusCode::NOT_FOUND);
		}
		Ok(true) => {
			{};
		}
	}

	let process_data = read_process_data(pid).unwrap();
	let initiate_args = process_data.steps.get(0).unwrap().args.as_ref().unwrap();
	// checkbox was checked on frontend
	result.active = initiate_args.len() > 1 && initiate_args[0] == "on";
	if result.active {
		result.description = Some(initiate_args[1].clone());
	}

	return Ok(Json(result));
}