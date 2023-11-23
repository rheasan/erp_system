import { NextApiRequest, NextApiResponse } from "next";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if(req.method !== 'POST'){
		return res.status(400).end();
	}

	let process_id = req.body.process_id;
	
	const endpoint = new URL(process.env.BACKEND_URL + "/get_process_data?process_id=" + process_id);
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
		console.log(`[ERROR]: Error in /api/get_process_data, error: ${e}`);
		return null;
	});


	if(result === null){
		return res.status(500).json({});
	}

	return res.status(200).json({result});
};