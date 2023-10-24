import { NextApiRequest, NextApiResponse } from "next";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if(req.method !== 'POST'){
		return res.status(400).end();
	}

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
		console.log(`[ERROR]: Error in /api/register_new_user, body: ${body}, error: ${e}`);
		return 500;
	});

	return res.status(response).json({});
};