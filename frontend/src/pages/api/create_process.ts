import { NextApiRequest, NextApiResponse } from "next";
const enum event {"initiate", "complete", "approve", "file_upload"};
type job = {
	event: event,
	args: Array<string>,
	next: Array<number>,
	required: Array<number>,
	current_index?: number,
}
type process = {
	pid: string,
	pname: string,
	desc: string,
	steps: Array<job>,
	roles: readonly ["any"]
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if(req.method !== 'POST') {
		return res.status(400).end();
	}
	const body = req.body as {process: process, username: string};
	const is_admin_endpoint = new URL(process.env.BACKEND_URL + "/is_admin?username=" + body.username);
	const msg = await fetch(is_admin_endpoint)
	.then((response) => {
		if(response.status != 200){
			return Promise.reject("Error completing query");
		}
		else{
			return response.json();
		}
	})
	.then((json) => {
		return json.value as boolean;
	})
	.catch((e) => {
		console.log(`[ERROR]: Error in /api/create_process, username: ${body.username}, error: ${e}`);
		return null;
	});

	if(msg === null){
		return res.status(500).json({});
	}
	// not an admin
	if(msg === false){
		return res.status(403).json({});
	}

	const endpoint = new URL(process.env.BACKEND_URL + "/process");
	const result = await fetch(endpoint, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body.process)
	})
	.then((res) => {
		if(res.status === 201) {
			return 200;
		}
		else {
			return Promise.reject("Error creating ticket " + res.statusText);
		}
	})
	.catch((e) => {
		console.log(`[ERROR]: Error in /api/create_process, username: ${body.username}, error: ${e}`);
		return null;
	});

	if(result === null) {
		return res.status(500).json({});
	}
	else {
		return res.status(200).json({});
	}
}

export default handler;