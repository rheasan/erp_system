import { afterAll, describe, expect, test } from 'vitest';
import postgres from 'postgres';
import "dotenv/config";
import { deepStrictEqual } from 'node:assert';

const username = process.env.ADMIN_USERNAME!;
const password = process.env.ADMIN_PASSWORD!;
const api_url = process.env.API_URL!;
const sql = postgres({database: "erp", username, password });

type NewUser = {
	username: string,
	roles: string,
	email: string
};


describe("test user registration flow", async () => {
	const new_user : NewUser = {
		username: "TEST_USER",
		roles: "admin",
		email: "example@example.org"
	};
	// first try to register user
	test("can register new user", async () => {
		const res = await fetch(api_url + "/new_user", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(new_user)
		});
		expect(res.status).toBe(200);
	});
	test("new user was added to the db", async () => {
		const user = await sql`select * from new_users where username='TEST_USER'`;
		expect(deepStrictEqual(user[0], new_user));
	});
	test("new user can be queried from api", async () => {
		const res = await fetch(api_url + "/new_user");
		expect(res.status).toBe(200);
		const json: Array<NewUser> = await res.json();
		expect(json.length).toBeGreaterThanOrEqual(1);
		let flag = false;
		for(const user of json){
			if(user.username == new_user.username){
				flag = true;
				break;
			}
		}
		expect(flag).toBeTruthy();
	});
	test("new users status before verification is `not verified`", async () => {
		const res = await fetch(api_url + "/new_user/approved?username=TEST_USER");
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.status).toBe(false);
	});
	test("new user can be verified", async () => {
		const res = await fetch(api_url + "/users", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({username: new_user.username})
		});
		// 201 == StatusCode::CREATED
		expect(res.status).toBe(201);
	});
	test("new user was actually verified", async () => {
		const users_res = await sql`select username, email from users where username=${new_user.username}`;
		expect(users_res[0].username).toBe(new_user.username);
		expect(users_res[0].email).toBe(new_user.email);
		
		const new_users_res = await sql`select * from new_users where username=${new_user.username}`;
		expect(new_users_res.length).toBe(0);
	});
	test("new user verification status can be queried from api", async () => {
		const res = await fetch(api_url + "/new_user/approved?username=TEST_USER");
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.status).toBe(true);
	});
	test("user received the required role", async () => {
		const user_roles_query = await sql`select array_agg(role_) as user_roles from roles join users on users.userid=roles.userid where users.username=${new_user.username}`;
		const user_roles = user_roles_query[0].user_roles;
		expect(user_roles.length).toBe(1);
		expect(user_roles[0]).toBe("admin");

	});
	afterAll(async () => {
		const query = await sql`select userid from users where username=${new_user.username}`;
		const new_user_userid = query[0].userid;
		await sql`delete from roles where userid=${new_user_userid}`;
		await sql`delete from users where username=${new_user.username}`;
		// this should'nt be needed really
		await sql`delete from new_users where username=${new_user.username}`;
	});
});
