import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";


type TicketData  = {
	current_tickets: CurrentTicket[],
	own_tickets: OwnTicket[]
}
type CurrentTicket = {
	// TODO: type_ = approve (for now)
	type_: string,
	ticketid: number,
	active: boolean,
	node_number: number,
	process_id: string,
	owner_name: string
}
type OwnTicket = {
	id: number,
	process_id: string,
	is_public: boolean,
	created_at: string,
	updated_at: string,
	status: string,
}


const CurrentTicketContainer = (props: {current_tickets: CurrentTicket[]}) => {
	const {user} = useUser();
	const [currentTickets, setCurrentTickets] = useState(props.current_tickets);
	const format_type = (type: string) => {
		switch(type) {
			case "approve" : {
				return "Approval needed"
			}
			default: {
				return type;
			}
		}
	}
	const handle_ticket_event = (ticket: CurrentTicket, status: boolean) => {
		fetch("/api/ticket/update", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				ticket_id: ticket.ticketid,
				status: status,
				username: user?.username,
				node: ticket.node_number
			})
		})
		.then(() => {
			setCurrentTickets((prev) => {
				let new_tickets = prev.filter((t) => t.ticketid != ticket.ticketid);
				return new_tickets;
			});
			toast.success("Ticket updated");
		})
	}
	const Current_ticket = (props: {ticket: CurrentTicket}) => {
		let {ticket} = props;

		return (
			<div className="flex flex-col p-2 border border-white w-fit bg-gray-900 rounded px-8">
				<p>Process: {ticket.process_id}</p>
				<p>Ticket created by {ticket.owner_name}</p>
				<p>{format_type(ticket.type_)}</p>
				{
					ticket.type_ == "approve" && (
						<div className="flex flex-row gap-2 p-2 text-black">
							{/* FIXME: this logic should be extracted into its own function to prevent new unique function binding for each button*/}
							<button className="bg-green-400 p-2 rounded" onClick={() => handle_ticket_event(ticket, true)}>Approve</button>
							<button className="bg-red-400 p-2 rounded" onClick={() => handle_ticket_event(ticket, false)}>Reject</button>
						</div>
					)
				}
			</div>
		)
	}

	return (
		<div className="p-4 flex flex-col gap-4">
			<h1 className="text-2xl">Current Tickets</h1>
			{
				currentTickets.length === 0 && (
					<p>No current tickets</p>
				)
			}
			{
				currentTickets.length > 0 && currentTickets?.map((ticket) => {
					return <Current_ticket ticket={ticket} key={ticket.process_id+ticket.node_number} />
				})
			}
		</div>
	)
}

const OwnTicketContainer = (props: {own_tickets: OwnTicket[] | undefined}) => {
	const groupTickets = (tickets: OwnTicket[] | undefined) => {
		let groupedTickets: {open: OwnTicket[], closed: OwnTicket[], rejected: OwnTicket[]} = {
			open: [],
			closed: [],
			rejected: []
		};
		if(tickets === undefined) {
			return groupedTickets;
		}
		for(let ticket of tickets){
			if(ticket.status == "open") {
				groupedTickets.open.push(ticket);
			}
			else if(ticket.status == "closed") {
				groupedTickets.closed.push(ticket);
			}
			else {
				groupedTickets.rejected.push(ticket);
			}
		}
		return groupedTickets;
	}
	const [ownTickets, _] = useState(groupTickets(props.own_tickets));
	const Own_ticket = (props: {ticket: OwnTicket}) => {
		let {ticket} = props;

		return (
			<div className="flex flex-col p-2 border border-black w-fit my-2">
				<p>Process: {ticket.process_id}</p>
				<p>Ticket id: {ticket.id}</p>
				<p>Created At: {new Date(ticket.created_at).toUTCString()}</p>
				<p>Last updated At: {new Date(ticket.updated_at).toUTCString()}</p>
				<p>Status: {ticket.status}</p>
			</div>
		)
	}

	return (
		<div>
			<h1 className="text-2xl">Your Tickets</h1>
			{
				ownTickets?.open.length === 0 && ownTickets?.closed.length === 0 && ownTickets?.rejected.length === 0 && (
					<p>No tickets</p>
				)
			}
			{
				(ownTickets?.open.length > 0 || ownTickets?.closed.length > 0 || ownTickets?.rejected.length > 0) &&
				<ul className="list-disc mx-4">
					<li>
						<h1 className="text-xl">Open Tickets</h1>
						{
							ownTickets?.open.map((ticket) => {
								return <Own_ticket ticket={ticket} key={ticket.id} />
							})
						}
					</li>
					<li>
						<h1 className="text-xl">Closed Tickets</h1>
						{
							ownTickets?.closed.map((ticket) => {
								return <Own_ticket ticket={ticket} key={ticket.id} />
							})
						}
					</li>
					<li>
						<h1 className="text-xl">Rejected Tickets</h1>
						{
							ownTickets?.rejected.map((ticket) => {
								return <Own_ticket ticket={ticket} key={ticket.id} />
							})
						}
					</li>
				</ul>
			}	
		</div>
	)
}


const TicketSearch = () => {
	const [tickets, setTickets] = useState<TicketData | null>(null);
	const {user, isLoaded} = useUser();
	useEffect(() => {
		if(isLoaded) {
			let req_body = {
				username: user?.username
			};
			fetch("/api/ticket/user", {
				method: "POST",
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(req_body)
			})
			.then((res) => {
				if(res.status != 200) {
					return Promise.reject("Error fetching tickets");
				}
				else{
					return res.json();
				}
			})
			.then((data) => {
				setTickets(data.tickets);
			})
			.catch((e) => {
				toast.error(e);
			})
		}
	}, [isLoaded]);

	if(tickets === null){
		return <p>Loading tickets...</p>
	}
	return (
		<div>
			<CurrentTicketContainer current_tickets={tickets?.current_tickets!}/>
			<div className="border-b-2 border-white"></div>
			<OwnTicketContainer own_tickets={tickets?.own_tickets!}/>
		</div>
	);
}

export default TicketSearch;