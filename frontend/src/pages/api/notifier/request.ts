import { NextApiRequest, NextApiResponse } from "next";
import { clerkClient, getAuth } from "@clerk/nextjs/server";


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


	const get_userid_endpoint = new URL(process.env.BACKEND_URL + "/userid?username=" + username);
	const userid: string | null = await fetch(get_userid_endpoint)
	.then((response) => {
		if(response.status !== 200){
			return Promise.reject(response.status);
		}
		else{
			return response.json();
		}
	})
	.then((json) => {
		return json.userid as string;
	})
	.catch((e) => {
		console.error(`[ERROR]: Error in /api/notifier/request get_userid, error: ${e}`);
		return null;
	});

	if(userid === null){
		return res.status(500).end();
	}
	
	const endpoint = new URL(process.env.BACKEND_URL + "/notifier/request_token");
	const msg = await fetch(endpoint, {
		method: 'POST',
		body: JSON.stringify({userid}),
		headers: {
			"Content-Type": "application/json"
		}
	})
	.then((response) => {
		if(response.status != 200){
			return Promise.reject("Error completing query");
		}
		else{
			return response.json();
		}
	})
	.then((json) => {
		return json as {token: string};
	})
	.catch((e) => {
		console.log(`[ERROR]: Error in /api/notifier/request, error: ${e}`);
		return null;
	});

	if(msg === null){
		return res.status(500).json({});
	}

	return res.status(200).json({msg});
}