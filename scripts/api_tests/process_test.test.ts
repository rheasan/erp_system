import { afterAll, describe, expect, test, expectTypeOf } from 'vitest';
import postgres from 'postgres';
import "dotenv/config";
import fs from "node:fs/promises";
import path from 'node:path';

const userid = process.env.ADMIN_USERID!;
const username = process.env.ADMIN_USERNAME!;
const password = process.env.ADMIN_PASSWORD!;
const api_url = process.env.API_URL!;
const sql = postgres({database: "erp", username, password });

type Job = {
	event: string,
	args: Array<string> | null,
	next: Array<number>,
	required: Array<number>
};
type Process = {
	pname: string,
	pid: string,
	steps: Array<Job>,
	desc: string | null,
	roles: Array<string>
};
const correct_data: Process = {
  "pname": "process for recruiting staff under research project",
  "pid": "TEST",
  "steps": [
    { "event": "initiate", "args": [], "next": [1], "required": [] },
    {
      "event": "approve",
      "args": ["a_registrar_r_d"],
      "next": [2],
      "required": [0]
    },
    {
      "event": "approve",
      "args": ["a_dean_r_d"],
      "next": [3],
      "required": [1]
    },
    { "event": "approve", "args": ["director"], "next": [4], "required": [2] },
    { "event": "notify", "args": ["director"], "next": [5], "required": [3] },
    { "event": "complete", "args": null, "next": [], "required": [4] }
  ],
  "desc": "process for recruiting staff under research project",
  "roles" : ["any"]
};
const incorrect_data = {
  "pname": "process for recruiting staff under research project",
  "steps": [
    { "event": "initiate", "args": [], "next": [1], "required": [] },
    {
      "event": "approve",
      "args": ["a_registrar_r_d"],
      "next": [2],
      "required": [0]
    },
    {
      "event": "approve",
      "args": ["a_dean_r_d"],
      "next": [3],
      "required": [1]
    },
    { "event": "approve", "args": ["director"], "next": [4], "required": [2] },
    { "event": "notify", "args": ["director"], "next": [5], "required": [3] },
    { "event": "complete", "args": null, "next": [], "required": [4] }
  ],
  "desc": "process for recruiting staff under research project",
  "roles" : ["any"]
};


test("DB connection check", async () => {
	const res : [{username: string}] = await sql`select username from users where userid=${userid}`;
	const res_username = res[0].username;
	expect(res_username).toBe(username);
});

describe("Correct Process is accepted", async () => {
	const res = await fetch(api_url + "/process", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(correct_data)
	});
	test("API returned StatusCode::CREATED", () => {
		expect(res.status).toBe(201);
	});
	test("Process was added to db", async () => {
		const db_res = await sql`select count(*) from process_defs where process_id='TEST'`;
		expect(db_res.length).toBe(1);
	});
	// cleanup
	afterAll(async () => {
		await sql`delete from process_defs where process_id='TEST'`;
		await fs.rm(path.join(process.env.PROCESS_DATA_DIR!, "TEST.json"));
	})
});

describe("Incorrect Process is rejected", async () => {
	const res = await fetch(api_url + "/process", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(incorrect_data)
	});

	test("API should return StatusCode::UNPROCESSABLE_ENTITY", () => {
		expect(res.status).toBe(422);
	});
});

test("/process/all works", async () => {
	const res = await fetch(api_url + "/process/all?username=" + username);
	expect(res.status).toBe(200);
	const json = await res.json();

	expectTypeOf(json).toMatchTypeOf(Array<{process_id: string, description: string}>);
});