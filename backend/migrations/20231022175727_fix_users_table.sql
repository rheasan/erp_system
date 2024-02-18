-- Add migration script here
alter table users add constraint username_uniq UNIQUE(username);