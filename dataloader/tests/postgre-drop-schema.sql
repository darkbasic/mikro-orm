set names 'utf8';
set session_replication_role = 'replica';

drop table if exists "match" cascade;
drop table if exists "site" cascade;
drop table if exists "specialty" cascade;
drop table if exists "sport" cascade;
drop table if exists "user" cascade;
drop table if exists "match_to_user" cascade;
drop table if exists "site_to_sport" cascade;

set session_replication_role = 'origin';
