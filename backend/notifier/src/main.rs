use chrono::Local;
use serde::{Deserialize, Serialize};
use serde_json::to_string;
use futures::{pin_mut, SinkExt, StreamExt, TryStreamExt};
use once_cell::sync::Lazy;
use tokio::net::{TcpListener, TcpStream};
use tokio::io::AsyncReadExt;
use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender};
use tokio::sync::Mutex;
use tokio::time::sleep;
use tokio_tungstenite::tungstenite::Message;
use std::collections::HashMap;
use std::net::SocketAddr;
use std::time::Duration;
use tokio::{select, task};

enum Ping {
    CollectNew,
    Clear,
	ClientIdTransfer(String)
}

struct NewClientData {
	token: String,
	// https://docs.rs/chrono/latest/chrono/struct.DateTime.html#method.timestamp
	expires_at: i64
}

#[derive(Serialize, Deserialize, sqlx::FromRow, Clone)]
struct Notification {
	userid: uuid::Uuid,
	messages: Vec<(String, chrono::DateTime<chrono::Utc>)>,
}


// TODO: add support for multiple clients 
// key: client token
static NEW_CLIENT_QUEUE : Lazy<Mutex<HashMap<String,NewClientData>>> = Lazy::new(|| {
	return Mutex::new(HashMap::new());
});

static CONNECTED_CLIENTS : Lazy<Mutex<HashMap<String,Vec<UnboundedSender<Notification>>>>> = Lazy::new(|| {
	return Mutex::new(HashMap::new());
});



// all new client tokens will expire in 10 sec
static NEW_TOKEN_EXPIRY : u64 = 10000u64;
static MAX_CLIENTS_PER_USER : usize = 3usize;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv::dotenv().ok();
    let ws_port = std::env::var("SOCKET_SERVER_PORT").expect("SOCKET_SERVER_PORT not defined");
    let ws_port = ws_port.parse::<u16>().unwrap();

    // handle pings from backend to notifier
	let (ping_tx, ping_rx) = unbounded_channel::<Ping>();
	let (notif_tx, notif_rx) = unbounded_channel::<()>();

    let ping_thread = task::spawn(async move {
        let tx = ping_tx.clone();
        handle_pings(tx).await;
    });
    let notif_thread = task::spawn(async move {
        exec_ping(ping_rx, notif_tx).await;
    });
	let cleaner_thread = task::spawn(async {
		clean_queue().await;
	});
	let pull_thread = task::spawn(async move {
		pull_notifications(notif_rx).await;
	});

	// create socket server

	let addr = SocketAddr::from(([0, 0, 0, 0], ws_port));
	let listener = TcpListener::bind(&addr).await.unwrap();

	while let Ok((stream, addr)) = listener.accept().await {
		tokio::spawn(handle_socket(stream, addr));
	}

	pin_mut!(ping_thread, notif_thread, cleaner_thread, pull_thread);
	select! {
		_ = ping_thread => {
			eprintln!("[Error] [{}] Ping thread failed", Local::now());
		}

		_ = notif_thread => {
			eprintln!("[Error] [{}] Notif thread failed", Local::now());
		}

		_ = cleaner_thread => {
			eprintln!("[Error] [{}] Cleaner thread failed", Local::now());
		}

		_ = pull_thread => {
			eprintln!("[Error] [{}] Pull thread failed", Local::now());
		}
	}
    Ok(())
}

async fn handle_socket(stream: TcpStream, addr: SocketAddr) {

	let ws_stream = tokio_tungstenite::accept_async(stream)
		.await
		.expect("Couldn't complete websocket handshake.");

	// TODO: authenticate the client first before connecting
	println!("[INFO] [{}] New Client attempting to connect : {}", Local::now(), addr.to_string());

	let (mut send, mut recv) = ws_stream.split();
	send.send(Message::Text("Hello".to_string()))
		.await
		.unwrap();

	// receive token from the client
	let data = recv.try_next().await.expect("Could not read client_id from client message");
	if data.is_none() {
		eprintln!("[Error] [{}] Client: {} did not send token", Local::now(), addr.to_string());
		return;
	}
	let client_id = data.unwrap();
	if !client_id.is_text() {
		eprintln!("[Error] [{}] Client: {} did not send text message for token", Local::now(), addr.to_string());
		return;
	}
	let client_id = client_id.into_text().unwrap();
	let client_userid = client_id.split_at(36).0.to_string();
	// check if the token is valid
	{
		let guard = NEW_CLIENT_QUEUE.lock().await;
		if !guard.contains_key(&client_id) {
			eprintln!("[Error] [{}] Client: {} sent invalid or expired token", Local::now(), addr.to_string());
			return;
		}
	}

	// add the client to connected clients
	let (client_tx, mut client_rx) = unbounded_channel::<Notification>();
	{
		let mut guard = CONNECTED_CLIENTS.lock().await;
		if guard.contains_key(&client_userid){
			let clients = guard.get_mut(&client_userid).unwrap();
			if clients.len() == MAX_CLIENTS_PER_USER {
				eprintln!("[WARNING] [{}] User: {} attemted to connect more than max allowed clients.", Local::now(), client_userid);
				return;
			}
			clients.push(client_tx);
		}
		else {
			guard.insert(client_userid.clone(), vec![client_tx]);
		}
		println!("[INFO] [{}] Client: {}, userid: {} successfully connected", Local::now(), addr.to_string(), client_userid);
	}

	// send notifications to client
	while let Some(notifications) = client_rx.recv().await {
		let serialized = to_string(&notifications.messages).unwrap();
		send.send(Message::Text(serialized)).await.unwrap();
	}
	println!("[INFO] [{}] Client: {}, userid: {} disconnected", Local::now(), addr.to_string(), client_userid);
}

async fn handle_pings(tx: UnboundedSender<Ping>) {
    let addr = SocketAddr::from(([0, 0, 0, 0], 3003));
    let listner = TcpListener::bind(addr).await.unwrap();
    println!("[INFO] [{}] Listening to server on {:?}", Local::now(), addr);

    loop {
        // accept will block the current thread
        let conn = listner.accept().await;
        match conn {
            Ok((mut stream, _addr)) => {
                //continuously read 8 bytes from the connection
                let mut buf = [0u8; 8];
                stream.read_exact(&mut buf).await.unwrap();
                let data = u64::from_ne_bytes(buf);

                match data {
                    1 => tx.send(Ping::CollectNew).unwrap(),
                    2 => tx.send(Ping::Clear).unwrap(),
					3 => {
						// the client id should be 73 characters
						let mut data_buf = [0u8; 73];
						stream.read_exact(&mut data_buf).await.unwrap();
						let data_buf = data_buf.to_vec();
						// TODO: dont clone this
						let client_id = String::from_utf8(data_buf.clone());
						if let Err(_) = client_id {
							eprintln!("[Error] [{}] Failed to parse client id. Bytes received: {:?}", Local::now(), data_buf);
						}
						tx.send(Ping::ClientIdTransfer(client_id.unwrap())).unwrap();
						
					}
                    _ => eprintln!("[Error] [{}] Malformed ping received.", Local::now()),
                }
            }
            Err(e) => {
                eprintln!("[Error] [{}] Connection failed. {}", Local::now(), e);
            }
        }
    }
}

async fn exec_ping(mut ping_rx: UnboundedReceiver<Ping>, notif_tx: UnboundedSender<()>) {
    while let Some(ping) = ping_rx.recv().await {
        match ping {
            Ping::Clear => {
                println!("[INFO] [{}] Clear ping received", Local::now());
            }
            Ping::CollectNew => {
                println!("[INFO] [{}] Collect New Ping received", Local::now());
				notif_tx.send(()).unwrap();
            }
			Ping::ClientIdTransfer(client_id) => {
				println!("[INFO] [{}] Client id received: {}", Local::now(), client_id);
				// add the client_id to the map
				{
					// when MutexGuard falls out of scope the Mutex will be unlocked
					let time = chrono::Utc::now().timestamp();
					let data = NewClientData {
						token: client_id.clone(),
						expires_at: time
					};
					// TODO: if the guard is not returned before out token expires then what???
					let mut guard = NEW_CLIENT_QUEUE.lock().await;
					guard.insert(client_id, data);
				}
			}
        }
    }
    return;
}

// TODO: impl better cleaning algorithm
async fn clean_queue() {
	sleep(Duration::from_millis(NEW_TOKEN_EXPIRY)).await;
	let cur_time = chrono::Utc::now().timestamp();
	{
		let mut guard = NEW_CLIENT_QUEUE.lock().await;
		// INFO: retain works in O(capacity) not O(len)
		guard.retain(|_, data| data.expires_at > cur_time);
	}
}


async fn pull_notifications(mut notif_rx: UnboundedReceiver<()>) {
	let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL not defined");
	let pool = sqlx::PgPool::connect(&db_url).await.expect("Failed to connect to db");

	while let Some(()) = notif_rx.recv().await {
		let mut transaction = pool.begin().await.expect("Failed to start transaction");
		let query: Result<Vec<Notification>, _> = sqlx::query_as("select userid, array_agg((message, created_at)) as messages from notifications group by userid")
		.fetch_all(&mut *transaction)
		.await;

		if let Err(e) = query {
			eprintln!("[Error] [{}] Failed to query db. Error: {}", Local::now(), e);
			return;
		}
		let notifications = query.unwrap();

		{
			let guard = CONNECTED_CLIENTS.lock().await;
			// TODO: save notifications that were not sent
			for notif in notifications {
				let userid = notif.userid.to_string();
				if !guard.contains_key(&userid) {
					continue;
				}
				let clients = guard.get(&userid).unwrap();
				for client in clients {
					// TODO: maybe put the notif in a box to avoid cloning
					client.send(notif.clone()).unwrap();
				}
			}
		}

		transaction.commit().await.expect("Failed to commit transaction");
	}
}