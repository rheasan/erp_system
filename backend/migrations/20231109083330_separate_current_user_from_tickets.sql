-- Add migration script here
alter table tickets drop column current_user_id;
alter table tickets add complete integer;
create table user_active_tickets (
	id serial primary key,
	userid uuid REFERENCES users(userid),
	ticketid integer references tickets(id)
);