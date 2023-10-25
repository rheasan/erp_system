import { NextApiRequest, NextApiResponse } from "next";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if(req.method !== 'GET'){
		return res.status(400).end();
	}
	
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
		console.log(`[ERROR]: Error in /api/get_new_users, error: ${e}`);
		return null;
	});

	if(data === null){
		return res.status(500).json({});
	}

	return res.status(200).json({new_users: data});
};