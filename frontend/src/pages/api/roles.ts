import { NextApiRequest, NextApiResponse } from "next";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if(req.method === 'POST'){
		const body = req.body as {role_: string};
		const endpoint = new URL(process.env.BACKEND_URL + "/roles");
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		})
		.then((response) => {
			if(response.status === 201){
				return 201;	
			}
			else{
				return 200;
			}
		})
		.catch((e) => {
			console.log(`[ERROR]: Error in /api/roles/POST, body: ${body}, error: ${e}`);
			return 500;
		});

		return res.status(response).json({});

	}
	else if(req.method === "GET") {
		const endpoint = new URL(process.env.BACKEND_URL + "/roles");
		const msg = await fetch(endpoint)
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
			console.log(`[ERROR]: Error in /api/roles/GET, error: ${e}`);
			return null;
		});

		if(msg === null){
			return res.status(500).json({});
		}

		return res.status(200).json({roles: msg});
	}
};