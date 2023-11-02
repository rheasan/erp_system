use axum::{
    Json,
    http::StatusCode,
	extract
};
use serde::{Serialize, Deserialize};
use sqlx::PgPool;
use std::path::PathBuf;
use walkdir::WalkDir;

#[derive(Serialize, Deserialize, Clone)]
pub struct Process {
    pub pname: String,
    pub pid: String,
    pub jobs: Vec<Job>,
    pub desc: Option<String>
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Job {
    event: String,
    args : Option<Vec<String>>
}

pub fn read_process_data(pid: String) -> Result<Process, std::io::Error> {
    // TODO: read the path from env var
    // TODO: the process data should have static lifetime. dont read the file for every request
    let data_path = PathBuf::from(format!("D:/7th_sem/erp_system/backend/data/{}.json", pid));
    let process_data = std::fs::read_to_string(data_path)?;
    let parsed_data = serde_json::from_str::<Process>(&process_data)?;

    return Ok(parsed_data);
}

fn save_process_data(data: &Process) -> Result<(), std::io::Error> {
	let pid = data.pid.clone();
    let data_path = PathBuf::from(format!("D:/7th_sem/erp_system/backend/data/{}.json", pid));
    let serialized = serde_json::to_string::<Process>(&data).unwrap();

    std::fs::write(data_path, serialized)?;
    return Ok(());
}

pub async fn get_all_processes() -> Result<Json<Vec<String>>, StatusCode> {
	let config_path = PathBuf::from("D:/7th_sem/erp_system/backend/data");
	let mut names = Vec::new();
	for entry in WalkDir::new(config_path) {
		let entry = entry.unwrap();
		if entry.metadata().unwrap().is_dir() {
			continue;
		}
		// TODO: find better way!!!!!
		let filename = entry.file_name().to_str().unwrap().to_string().replace(".json", "");
		names.push(filename);
	}
	return Ok(Json(names));
}

pub async fn create_process(
	extract::State(pool) : extract::State<PgPool>,
    Json(payload) : Json<Process>,
) -> Result<StatusCode, StatusCode> {
	let pid = payload.pid.clone();
	let config_path =  PathBuf::from(format!("D:/7th_sem/erp_system/backend/data/{}.json", pid));
	match config_path.try_exists() {
		Err(e) => {
			eprintln!("Error reading saved process data: {}", e);
			return Err(StatusCode::INTERNAL_SERVER_ERROR);
		}
		Ok(true) => {
			eprintln!("Process with pid {} already exists", pid);
			return Err(StatusCode::FORBIDDEN);
		}
		Ok(false) => {
			{};
		}
	}
	let mut tx = pool.begin().await.unwrap();

    

	let query = sqlx::query("insert into process_defs (process_id, allowed_roles) values ($1, $2)")
		.bind(&payload.pid)
		.bind(vec![String::from("any")])
		.execute(&mut *tx)
		.await;

	if let Err(e) = query {
		eprintln!("Error inserting new process: {} for pid {}", e, payload.pid);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}

	if let Err(e) = save_process_data(&payload) {
        eprintln!("Error saving new process data: {}", e);
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

	let result = tx.commit().await;
	if let Err(e) = result {
		eprintln!("Error commiting transaction: {} for pid {}", e, payload.pid);
		std::fs::remove_file(config_path).unwrap();
		return Err(StatusCode::INTERNAL_SERVER_ERROR);
	}
    return Ok(StatusCode::CREATED);
}