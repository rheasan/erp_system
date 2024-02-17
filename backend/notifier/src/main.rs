use std::io::Read;
use std::net::{SocketAddr, TcpListener};
use std::sync::mpsc::{channel, Sender, Receiver};
use std::thread;
use chrono::Local;

enum Ping {CollectNew, Clear}

fn main() {
	
	let (tx, rx) = channel::<Ping>();

	let ping_thread = thread::spawn(move || {
		let tx = tx.clone();
		handle_pings(tx);
	});
	let notif_thread = thread::spawn(move || {
		send_notif(rx);
	});

	ping_thread.join().unwrap();
	notif_thread.join().unwrap();
}

fn handle_pings(tx: Sender<Ping>){
	let addr = SocketAddr::from(([0, 0, 0, 0], 3003));
	let listner = TcpListener::bind(addr).unwrap();
	println!("Listening on {:?}", addr);

	loop {
		// accept will block the current thread
		let conn = listner.accept();
		match conn {
			Ok((mut stream, addr)) => {
				println!("New incoming connection from {:?}", addr);
				//continuously read 8 bytes from the connection
				let mut buf = [0u8; 8];
				stream.read_exact(&mut buf).unwrap();
				let data = u64::from_ne_bytes(buf);

				match data {
					1 => tx.send(Ping::CollectNew).unwrap(),
					2 => tx.send(Ping::Clear).unwrap(),
					_ => eprintln!("[Error] [{}] Malformed ping received.", Local::now())
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
			},
			Ping::CollectNew => {
				println!("Collect New Ping received");
			}
		}
	}
	return;
}
