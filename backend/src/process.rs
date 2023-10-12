use axum::{
    Json,
    http::StatusCode
};
use serde::{Serialize, Deserialize};
use std::path::Path;

#[derive(Serialize, Deserialize)]
pub struct Process {
    pname: String,
    pid: String,
    jobs: Vec<Job>,
    desc: Option<String>
}

#[derive(Serialize, Deserialize)]
pub struct Job {
    name: String,
    commands : Vec<String>
}

fn read_process_data() -> Result<Vec<Process>, std::io::Error> {
    // TODO: read the path from env var
    // TODO: the process data should have static lifetime. dont read the file for every request
    let data_path = Path::new("D:/7th_sem/erp_system/backend/data/processes.json");
    let process_data = std::fs::read_to_string(data_path)?;
    let parsed_data = serde_json::from_str::<Vec<Process>>(&process_data)?;

    return Ok(parsed_data);
}

pub async fn get_processes() -> Result<Json<Vec<Process>>, StatusCode> {
    let data = read_process_data();

    if let Err(e) = data {
        eprintln!("Error reading saved process data: {}", e);
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }
    else {
        return Ok(Json(data.unwrap()));
    }
}