import { NextApiRequest, NextApiResponse } from "next";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if(req.method === 'POST'){
		const body = req.body as {is_public: boolean, owner_name?: string, process_id: string, owner_id? : string, filename?: string, file_url?: string};

		const get_userid_endpoint = new URL(process.env.BACKEND_URL + "/userid?username=" + body.owner_name);
		const userid: string | null = await fetch(get_userid_endpoint)
		.then((response) => {
			if(response.status !== 200){
				return Promise.reject(response.status);
			}
			else{
				return response.json()
			}
		})
		.then((json) => {
			return json.userid as string;
		})
		.catch((e) => {
			console.error(`[ERROR]: Error in /api/ticket/POST get_userid, body: ${body}, error: ${e}`);
			return null;
		});

		if(userid === null){
			return res.status(500).end();
		}
		else {
			body.owner_id = userid;
		}

		const endpoint = new URL(process.env.BACKEND_URL + "/ticket");
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
				return 500;
			}
		})
		.catch((e) => {
			console.log(`[ERROR]: Error in /api/ticket/POST, body: ${body}, error: ${e}`);
			return 500;
		});

		return res.status(response).json({});
	}
};