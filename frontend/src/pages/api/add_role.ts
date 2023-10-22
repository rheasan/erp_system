import { NextApiRequest, NextApiResponse } from "next";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if(req.method !== 'POST'){
		return res.status(400).end();
	}

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
		console.log(`[ERROR]: Error in /api/add_role, body: ${body}, error: ${e}`);
		return 500;
	});

	return res.status(response).json({});
};