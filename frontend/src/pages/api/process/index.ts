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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if(req.method === 'GET'){
		let process_id = req.query.process_id;
		
		const endpoint = new URL(process.env.BACKEND_URL + "/process?process_id=" + process_id);
		const result : {active: boolean, description: string | null} = await fetch(endpoint)
		.then((response) => {
			if(response.status != 200){
				return Promise.reject("Error completing query");
			}
			else{
				return response.json();
			}
		})
		.catch((e) => {
			console.log(`[ERROR]: Error in /api/process/GET, error: ${e}`);
			return null;
		});


		if(result === null){
			return res.status(500).json({});
		}

		return res.status(200).json({result});
	}
	else if(req.method === "POST") {
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
			console.log(`[ERROR]: Error in /api/process/POST, username: ${body.username}, error: ${e}`);
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
				return Promise.reject("Error creating process " + res.statusText);
			}
		})
		.catch((e) => {
			console.log(`[ERROR]: Error in /api/process/POST, username: ${body.username}, error: ${e}`);
			return null;
		});

		if(result === null) {
			return res.status(500).json({});
		}
		else {
			return res.status(200).json({});
		}
	}
};