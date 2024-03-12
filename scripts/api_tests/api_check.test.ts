import {expect, test} from 'vitest';
import "dotenv/config";


const api_url : string = process.env.API_URL!;


test('Api health check', async () => {
	const res = await fetch(api_url);
	expect(res.status).toBe(200);
	const msg = await res.text();
	expect(msg).toBe("Hello, world!");
});