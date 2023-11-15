import { NextApiRequest, NextApiResponse } from "next";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if(req.method !== 'POST'){
		return res.status(400).end();
	}

	const body = req.body as {ticket_id: number, status: boolean, node: number, username?: string, user_id?: string};

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
	else {
		delete body.username;
		body.user_id = userid;
	}

	console.log(body);

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
			return Promise.reject("Error updating ticket. check backend logs");
		}
	})
	.catch((e) => {
		console.log(`[ERROR]: Error in /api/update_ticket, body: ${body}, error: ${e}`);
		return null;
	});
	if(response === null){
		res.status(500).end();
	}

	return res.status(200).json({});
};