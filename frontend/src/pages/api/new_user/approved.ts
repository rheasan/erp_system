import { NextApiRequest, NextApiResponse } from "next";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if(req.method !== 'GET'){
		return res.status(400).end();
	}
	const query = req.query.username;
	
	const endpoint = new URL(process.env.BACKEND_URL + "/new_user/approved?username=" + query);
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
		return json.status as boolean;
	})
	.catch((e) => {
		console.log(`[ERROR]: Error in /api/new_user/approved, query: ${query}, error: ${e}`);
		return null;
	});

	if(msg === null){
		return res.status(500).json({});
	}

	return res.status(200).json({msg});
};