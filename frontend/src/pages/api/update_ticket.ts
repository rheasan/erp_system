import { NextApiRequest, NextApiResponse } from "next";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if(req.method !== 'POST'){
		return res.status(400).end();
	}

	const body = req.body as {ticket_id: number, status: boolean};

	const endpoint = new URL(process.env.BACKEND_URL + "/update_ticket");
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	})
	.then((response) => {
		if(response.status === 200){
			return response.status;
		}
		else{
			return Promise.reject("Error fetching tickets. check backend logs");
		}
	})
	.catch((e) => {
		console.log(`[ERROR]: Error in /api/get_user_tickets, body: ${body}, error: ${e}`);
		return null;
	});
	if(response === null){
		res.status(500).end();
	}

	return res.status(200).json({});
};