-- Add migration script here
alter table user_active_tickets add type_ varchar(255) default 'own' not null;