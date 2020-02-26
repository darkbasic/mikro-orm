set names 'utf8';
set session_replication_role = 'replica';

drop table if exists "match" cascade;
drop table if exists "site" cascade;
drop table if exists "specialty" cascade;
drop table if exists "sport" cascade;
drop table if exists "user" cascade;
drop table if exists "match_to_user" cascade;
drop table if exists "site_to_sport" cascade;

create table "match" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "date" timestamptz(0) not null, "creator_id" int4 not null, "specialty_id" int4 not null, "site_id" int4 not null);

create table "site" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "name" varchar(255) not null, "position" varchar(255) not null);

create table "specialty" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "name" varchar(255) not null, "males" int4 not null, "females" int4 not null, "sport_id" int4 not null);

create table "sport" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "name" varchar(255) not null);

create table "user" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "email" varchar(255) not null, "name" varchar(255) not null, "surname" varchar(255) not null, "sex" int2 not null, "password" varchar(255) not null, "picture" varchar(255) null);

create table "match_to_user" ("match_id" int4 not null, "user_id" int4 not null);
alter table "match_to_user" add constraint "match_to_user_pkey" primary key ("match_id", "user_id");

create table "site_to_sport" ("site_id" int4 not null, "sport_id" int4 not null);
alter table "site_to_sport" add constraint "site_to_sport_pkey" primary key ("site_id", "sport_id");

alter table "match" add constraint "match_creator_id_foreign" foreign key ("creator_id") references "user" ("id") on update cascade;
alter table "match" add constraint "match_specialty_id_foreign" foreign key ("specialty_id") references "specialty" ("id") on update cascade;
alter table "match" add constraint "match_site_id_foreign" foreign key ("site_id") references "site" ("id") on update cascade;

alter table "specialty" add constraint "specialty_sport_id_foreign" foreign key ("sport_id") references "sport" ("id") on update cascade;

alter table "match_to_user" add constraint "match_to_user_match_id_foreign" foreign key ("match_id") references "match" ("id") on update cascade on delete cascade;
alter table "match_to_user" add constraint "match_to_user_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;

alter table "site_to_sport" add constraint "site_to_sport_site_id_foreign" foreign key ("site_id") references "site" ("id") on update cascade on delete cascade;
alter table "site_to_sport" add constraint "site_to_sport_sport_id_foreign" foreign key ("sport_id") references "sport" ("id") on update cascade on delete cascade;

set session_replication_role = 'origin';
