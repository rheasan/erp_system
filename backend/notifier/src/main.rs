use chrono::Local;
use futures::SinkExt;
use tokio::net::{TcpListener, TcpStream};
use tokio::io::AsyncReadExt;
use tokio_tungstenite::tungstenite::Message;
use std::net::SocketAddr;
use std::sync::mpsc::{channel, Receiver, Sender};
use tokio::task;

enum Ping {
    CollectNew,
    Clear,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv::dotenv().ok();
    let ws_port = std::env::var("SOCKET_SERVER_PORT").expect("SOCKET_SERVER_PORT not defined");
    let ws_port = ws_port.parse::<u16>().unwrap();

    // handle pings from backend to notifier
    let (tx, rx) = channel::<Ping>();

    let ping_thread = task::spawn(async move {
        let tx = tx.clone();
        handle_pings(tx).await;
    });
    let notif_thread = task::spawn(async move {
        send_notif(rx);
    });

	// create socket server

	let addr = SocketAddr::from(([0, 0, 0, 0], ws_port));
	let listener = TcpListener::bind(&addr).await.unwrap();

	while let Ok((stream, addr)) = listener.accept().await {
		tokio::spawn(handle_socket(stream, addr));
	}

    ping_thread.await.unwrap();
    notif_thread.await.unwrap();
    Ok(())
}

async fn handle_socket(stream: TcpStream, addr: SocketAddr) {
	println!("Incoming connection from: {}", addr.to_string());

	let mut ws_stream = tokio_tungstenite::accept_async(stream)
		.await
		.expect("Couldn't complete websocket handshake.");

	// TODO: authenticate the client first before connecting
	println!("Connection established: {}", addr.to_string());

	ws_stream.send(Message::Text("Hello".to_string()))
		.await
		.unwrap();
	println!("Client disconnected");
}

async fn handle_pings(tx: Sender<Ping>) {
    let addr = SocketAddr::from(([0, 0, 0, 0], 3003));
    let listner = TcpListener::bind(addr).await.unwrap();
    println!("Listening on {:?}", addr);

    loop {
        // accept will block the current thread
        let conn = listner.accept().await;
        match conn {
            Ok((mut stream, addr)) => {
                println!("New incoming connection from {:?}", addr);
                //continuously read 8 bytes from the connection
                let mut buf = [0u8; 8];
                stream.read_exact(&mut buf).await.unwrap();
                let data = u64::from_ne_bytes(buf);

                match data {
                    1 => tx.send(Ping::CollectNew).unwrap(),
                    2 => tx.send(Ping::Clear).unwrap(),
                    _ => eprintln!("[Error] [{}] Malformed ping received.", Local::now()),
                }
                println!("Received data: {}", data);
            }
            Err(e) => {
                eprintln!("Connection failed. {}", e);
            }
        }
    }
}

fn send_notif(rx: Receiver<Ping>) {
    while let Ok(ping) = rx.recv() {
        match ping {
            Ping::Clear => {
                println!("Clear ping received");
            }
            Ping::CollectNew => {
                println!("Collect New Ping received");
            }
        }
    }
    return;
}
