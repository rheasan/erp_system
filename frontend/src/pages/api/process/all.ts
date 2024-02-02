import { NextApiRequest, NextApiResponse } from "next";
import { clerkClient, getAuth } from "@clerk/nextjs/server";
type process_data = {
	process_id: string,
	description: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if(req.method !== 'GET'){
		return res.status(400).end();
	}

	const { userId } = getAuth(req);

	const user = userId ? await clerkClient.users.getUser(userId) : null;
	// calling from frontend should always give user because this api is only used in components inaccessible without login
	if(user === null) {
		return res.status(401).end();
	}
	// username shouldn't be null
	const username = user.username!;
	
	const endpoint = new URL(process.env.BACKEND_URL + "/process/all?username=" + username);
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
		return json as Array<process_data>;
	})
	.catch((e) => {
		console.log(`[ERROR]: Error in /api/get_all_processes, error: ${e}`);
		return null;
	});

	if(msg === null){
		return res.status(500).json({});
	}

	return res.status(200).json({msg});
}