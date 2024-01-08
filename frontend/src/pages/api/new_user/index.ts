import { NextApiRequest, NextApiResponse } from "next";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if(req.method === 'GET'){
		const endpoint = new URL(process.env.BACKEND_URL + "/new_user");
		const data = await fetch(endpoint)
		.then((response) => {
			if(response.status != 200){
				return Promise.reject("Error completing query");
			}
			else{
				return response.json();
			}
		})
		.then((json) => {
			return json as Array<string>;
		})
		.catch((e) => {
			console.log(`[ERROR]: Error in /api/new_user/GET, error: ${e}`);
			return null;
		});

		if(data === null){
			return res.status(500).json({});
		}

		return res.status(200).json({new_users: data});
	}

	else if(req.method === "POST") {
		const body = req.body as {username: string, email: string, roles: string};
		const endpoint = new URL(process.env.BACKEND_URL + "/new_user");
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		})
		.then((response) => {
			if(response.status === 200 || response.status === 409){
				return response.status;	
			}
			else{
				return 500;
			}
		})
		.catch((e) => {
			console.log(`[ERROR]: Error in /api/new_user/POST, body: ${body}, error: ${e}`);
			return 500;
		});

		return res.status(response).json({});
	}
	else {
		return res.status(400).end();
	}
	
};