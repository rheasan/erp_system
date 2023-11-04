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
const TicketCard = (props: TicketCardProps) => {
	const {data, setTickets} = props;

	const updateTicket = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, isApproved: boolean) => {
		const button = e.target as HTMLButtonElement;
		if(!data.is_current_user) {
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
					const newTickets = props.tickets?.filter((ticket) => ticket.id !== data.id);
					setTickets(newTickets!);
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
const TicketSearch = () => {
	const [tickets, setTickets] = useState<Ticket[] | null>(null);
	const {user} = useUser();

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
			setTickets(data.tickets);
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
				tickets !== null && tickets.map((ticket, i) => {
					return <TicketCard data={ticket} key={i} username={user?.username!} setTickets={setTickets} tickets={tickets}/>
				})
			}	
		</div>
	)
}

export default TicketSearch;