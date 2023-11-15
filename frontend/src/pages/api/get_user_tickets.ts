import { NextApiRequest, NextApiResponse } from "next";
type TicketData  = {
	current_tickets: CurrentTicket[],
	own_tickets: OwnTicket[]
}
type CurrentTicket = {
	type_: string,
	ticketid: number,
	active: boolean,
	node_number: number,
	process_id: string
}
type OwnTicket = {
	id: number,
	process_id: string,
	is_public: boolean,
	created_at: string,
	updated_at: string,
	status: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if(req.method !== 'POST'){
		return res.status(400).end();
	}

	const body = req.body as {username: string};

	const get_userid_endpoint = new URL(process.env.BACKEND_URL + "/get_userid?username=" + body.username);
	const userid: string | null = await fetch(get_userid_endpoint)
	.then((response) => {
		if(response.status !== 200){
			return Promise.reject(response.status);
		}
		else{
			return response.json();
		}
	})
	.then((json) => {
		return json.userid as string;
	})
	.catch((e) => {
		console.error(`[ERROR]: Error in /api/get_user_tickets get_userid, body: ${body}, error: ${e}`);
		return null;
	});

	if(userid === null){
		return res.status(500).end();
	}


	const endpoint = new URL(process.env.BACKEND_URL + "/get_user_tickets?userid=" + userid);
	const tickets = await fetch(endpoint)
	.then((response) => {
		if(response.status === 200){
			return response.json();
		}
		else{
			return Promise.reject("Error fetching tickets. check backend logs");
		}
	})
	.then((json) => {
		return json as TicketData;
	})
	.catch((e) => {
		console.log(`[ERROR]: Error in /api/get_user_tickets, body: ${body}, error: ${e}`);
		return null;
	});
	if(tickets === null){
		res.status(500).end();
	}

	return res.status(200).json({tickets});
};