-- Add migration script here
alter table tickets drop column status;
alter table tickets add status varchar(255) default 'open';