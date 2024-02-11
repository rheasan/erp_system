-- Add migration script here
create table new_users (
	username varchar
);
CREATE TABLE users (
	userid uuid PRIMARY KEY,
	username VARCHAR NOT NULL,
	email VARCHAR
);

CREATE TABLE role_defs (
	id serial PRIMARY KEY,
	role_ VARCHAR,
	UNIQUE (role_)
);

CREATE TABLE process_defs (
	process_id VARCHAR PRIMARY KEY,
	allowed_roles VARCHAR[]
);
CREATE TABLE roles (
	id serial PRIMARY KEY,
	userid uuid REFERENCES users(userid),
	role_ VARCHAR REFERENCES role_defs(role_),
	UNIQUE (userid, role_)
);

CREATE TABLE tickets (
	id serial PRIMARY KEY,
	owner_id uuid REFERENCES users(userid),
	current_user_id uuid REFERENCES users(userid),
	process_id VARCHAR REFERENCES process_defs(process_id),
	current_step int NOT NULL DEFAULT 1,
	log_id uuid NOT NULL,
	is_public BOOLEAN,
	created_at timestamptz,
	updated_at timestamptz
);