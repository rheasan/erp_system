use std::{collections::HashMap, path::PathBuf};
use serde::{Deserialize, Serialize};
use tokio::process::Command;
use once_cell::sync::Lazy;


static CALLBACK_DIR: Lazy<PathBuf> = Lazy::new(|| {
	PathBuf::from(std::env::var("PROCESS_DATA_PATH").unwrap()).join("scripts")
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

impl Callback {
	// FIXME: taking serde_json::Value instead of proper type per callback is not very safe
	pub async fn execute(&self, data: &Option<&serde_json::Value>) -> Result<(), String> {
		match self {
			Callback::Script { name, path } => {
				let data_string = serde_json::to_string(data).unwrap();
				let result = Command::new("python")
				.args(&[format!("{:?}", CALLBACK_DIR.join(path)), data_string])
				.output()
				.await;

				if let Err(e) = result {
					return Err(format!("Callback {name} failed to run. Error: {e}"));
				}
				let result = result.unwrap();

				if result.status.success() {
					let err_msg = String::from_utf8(result.stderr).unwrap();
					let exit_code = result.status.code().unwrap();
					return Err(format!("Callback {} exited with code: {}, stderr: {}", name, exit_code, err_msg));
				}

				return Ok(());
			}
			Callback::Webhook { name: _, url: _, headers: _ } => {
				todo!("impl webhooks")
			}
		}	
	}
	pub fn name(&self) -> &String {
		match self {
			Callback::Script { name, .. } => name,
			Callback::Webhook { name, .. } => name
		}
	}
}


