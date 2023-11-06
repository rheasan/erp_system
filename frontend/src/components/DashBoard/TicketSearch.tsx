import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Ticket  = {
	id: number,
	owner_id: string,
	process_id: string,
	is_public: boolean,
	created_at: string,
	updated_at: string,
	status: string,
	is_current_user: boolean
}
type TicketCardProps = {
	data: Ticket,
	username: string,
	tickets?: Ticket[],
	setTickets: React.Dispatch<React.SetStateAction<Ticket[] | null>>
}
type TicketState = {
	completed: Ticket[],
	open: Ticket[],
	rejected: Ticket[]
}

const TicketCard = (props: TicketCardProps) => {
	const {data, setTickets, tickets} = props;

	const updateTicket = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, isApproved: boolean) => {
		const button = e.target as HTMLButtonElement;
		if(data.is_current_user) {
			button.disabled = true;
		}
		fetch("/api/update_ticket", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				ticket_id: data.id,
				status: isApproved
			})
		})
		.then((res) => {
			if(res.status === 200){
				toast.success("Ticket updated successfully");
				console.log(data.is_current_user);
				if(!data.is_current_user){
					let newTicketState = structuredClone(tickets!);
					newTicketState = newTicketState.filter((ticket) => ticket.id !== data.id);
					setTickets(newTicketState);
				}
			}
			else{
				toast.error("Error while updating ticket");
			}
		})
		.catch(e => {
			toast.error(e);
		})

	}
	return (
		<div className="border-2 border-white rounded p-4 w-fit">
			<p>Process ID: {data.process_id}</p>
			<p>Ticket created by: {data.owner_id}</p>
			<p>Created at: {new Date(data.created_at).toUTCString()}</p>
			<p>Updated at: {new Date(data.updated_at).toUTCString()}</p>
			<p>Status: {data.status}</p>
			{
				data.is_current_user && data.status === "open" && 
				<div className="w-auto flex flex-row gap-2 justify-around">
					<button onClick={(e) => updateTicket(e, true)} className="border-white p-2 w-fit border rounded bg-green-900">Approve</button>
					<button onClick={(e) => updateTicket(e, false)} className="border-white p-2 w-fit border rounded bg-red-900">Reject</button>
				</div>
			}
		</div>	
	)
}

const TicketContainer = (props: {data: Ticket[] | null, type: keyof TicketState, username: string}) => {
	const {data, type, username} = props;
	const [tickets, setTickets] = useState<Ticket[] | null>(data);
	const formattedType = type[0].toUpperCase() + type.slice(1);
	return (
		<div>
			<h1 className="text-2xl">{formattedType} Tickets</h1>
			{
				tickets?.length === 0 && <p>No {formattedType} tickets</p>
			}
			{
				tickets?.map((ticket) => {
					return <TicketCard data={ticket} username={username} tickets={tickets} setTickets={setTickets} key={ticket.id} />
				})
			}
		</div>
	)
}

const TicketSearch = () => {
	const [tickets, setTickets] = useState<TicketState | null>(null);
	const {user} = useUser();

	const splitTickets = (tickets: Ticket[]) => {
		let res : TicketState = {
			completed: [],
			open: [],
			rejected: []
		};
		for(let i = 0; i < tickets.length; i++){
			if(tickets[i].status === "completed"){
				res.completed.push(tickets[i]);
			}
			else if(tickets[i].status === "open"){
				res.open.push(tickets[i]);
			}
			else{
				res.rejected.push(tickets[i]);
			}
		}
		return res;
	}

	const fetchAllTickets = () => {
		fetch("/api/get_user_tickets", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				username: user?.username
			})
		})
		.then((res) => {
			if(res.status !== 200) {
				return Promise.reject("Failed to fetch tickets");
			}
			else{
				return res.json();
			}
		})
		.then((data) => {
			setTickets(splitTickets(data.tickets));
		})
		.catch(e => {
			toast.error(e);
		})	
	}

	return (
		<div className="border-b-2 border-white flex flex-col gap-4">
			<div className="text-2xl">
				<p>Available tickets: <button onClick={fetchAllTickets} className="h-2 w-2">&#x27F3;</button></p>
			</div>
			{
				tickets === null && <p>No tickets found</p>
			}
			{
				tickets !== null &&
				<div className="flex flex-col gap-4">
					<TicketContainer data={tickets.open} type={"open"} username={user?.username!} />	
					<TicketContainer data={tickets.completed} type={"completed"} username={user?.username!} />	
					<TicketContainer data={tickets.rejected} type={"rejected"} username={user?.username!} />	
				</div>
			}	
		</div>
	)
}

export default TicketSearch;