use std::{collections::{HashMap, VecDeque}, io::ErrorKind, net::SocketAddr, time::Duration};
use chrono::Local;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use tokio::{io::AsyncReadExt, net::{TcpListener, TcpStream}, process::Command, sync::Mutex, time::sleep};


static MAX_TASK_EXECUTORS: usize = 4;


#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type")]
#[serde(rename_all = "snake_case")]
pub enum Callback {
	Script {
		name: String,
		path: String
	},
	Webhook {
		name: String,
		url: String,
		headers: HashMap<String, String>
	}
}
#[derive(Debug)]
pub struct Task {
	data: String,
	callbacks: Vec<Callback>
}

static TASK_QUEUE : Lazy<Mutex<VecDeque<Task>>> = Lazy::new(|| {
	return Mutex::new(VecDeque::new());
});


#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv::dotenv().ok();
    let callback_port = std::env::var("CALLBACK_SERVER_PORT").expect("CALLBACK_SERVER_PORT not defined");
    let callback_port = callback_port.parse::<u16>().unwrap();

	for _ in 0..MAX_TASK_EXECUTORS {
		tokio::spawn(execute_task());
	}

    // listen to pings
    let addr = SocketAddr::from(([0, 0, 0, 0], callback_port));
    let listener = TcpListener::bind(&addr).await.unwrap();
	println!("[INFO] [{}] Listening to server on {:?}", Local::now(), addr);

    while let Ok((stream, addr)) = listener.accept().await {
        tokio::spawn(handle_ping(stream, addr));
    }


    Ok(())
}

async fn execute_task() {
	loop {
		let task: Option<Task>;
		{
			let mut guard = TASK_QUEUE.lock().await;
			task = guard.pop_front();
		}

		if task.is_none() {
			sleep(Duration::from_millis(5000)).await;
			continue;
		}
		let task = task.unwrap();
		for callback in task.callbacks {
			let res = callback.execute(&task.data).await;
			if let Err(e) = res {
				eprintln!("[ERROR] [{}] Callback : {} failed: e: {}", Local::now(), callback.name(), e);
			}
		}
	}
}

async fn handle_ping(mut stream: TcpStream, addr: SocketAddr) {
    println!("[INFO] [{}] Incoming connection from: {}", Local::now(), addr);
    let header : u64 = stream.read_u64_le().await.unwrap();
	
	// SendTask == 1u64
	if header == 1u64 {
		// read message data
		let data_len = stream.read_u64_le().await.unwrap() as usize;
		let mut data_buffer = vec![0u8; data_len];
		// silently fail. if this fails now then the server will log the failure
		if let Err(_) = stream.read_exact(&mut data_buffer).await {
			return;
		}
		
		// read callback vector
		let callback_len = stream.read_u64_le().await.unwrap() as usize;
		let mut callback_buffer = vec![0u8; callback_len];
		if let Err(_) = stream.read_exact(&mut callback_buffer).await {
			return;
		}


		let data = String::from_utf8(data_buffer).unwrap();
		let callbacks: Vec<Callback> = serde_json::from_slice(&callback_buffer).unwrap();

		{
			let mut guard = TASK_QUEUE.lock().await;
			guard.push_back(Task { data, callbacks });
		}
	}
	// RegisterCallback == 2u64
	else if header == 2u64 {
		todo!("Implement callback registration.");
	}
}


impl Callback {
	pub async fn execute(&self, data: &String) -> Result<(), std::io::Error> {
		match self {
			Callback::Script {name, path} => {
				println!("[INFO] [{}] Executing callback: {}", Local::now(), name);

				let script_base_path = std::env::var("CALLBACK_DATA_PATH").unwrap();
				// FIXME: this is weird maybe
				let prgm = match path.ends_with(".py") {
					true => "python",
					false => "node"
				};

				let result = Command::new(prgm)
					.current_dir(script_base_path)
					.args([&path, data])
					.output()
					.await?;


				if !result.status.success() {
					let err_msg = String::from_utf8(result.stderr).unwrap();
					let exit_code = result.status.code().unwrap();
					return Err(std::io::Error::new(ErrorKind::Other, 
						format!("Code: {}, msg: {}", exit_code, err_msg)
					));
				}

				let res_stdout = String::from_utf8(result.stdout).unwrap();
				println!("[INFO] [{}] Callback {}. Stdout: {}", Local::now(), name, res_stdout);

				return Ok(());
			}
			Callback::Webhook { .. } => {
				todo!("Implement Webhook logic");
			}
		}
	}

	pub fn name(self) -> String {
		match self {
			Callback::Script { name, .. } => name,
			Callback::Webhook { name, .. } => name
		}
	}
}