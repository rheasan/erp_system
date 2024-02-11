-- Add migration script here

create table notifications (
	id serial primary key,
	userid uuid references users(userid),
	message text,
	created_at timestamptz
);