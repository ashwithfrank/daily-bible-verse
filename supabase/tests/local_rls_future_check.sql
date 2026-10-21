-- Verifies the optional migration 004 on a local PostgreSQL (see run_local_rls_check.sh).
\set ON_ERROR_STOP on
create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create role anon nologin; create role authenticated nologin;
grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
\i supabase/migrations/001_init.sql
\i supabase/migrations/003_admin_save_verse.sql
\i supabase/migrations/004_optional_hide_future_verses.sql

insert into auth.users values ('11111111-1111-1111-1111-111111111111', 'admin@example.com');
insert into public.admin_users values ('11111111-1111-1111-1111-111111111111');
insert into public.daily_verses (id, verse_date, reference, english_quote) values
  ('a0000000-0000-0000-0000-000000000001', (now() at time zone 'Asia/Kolkata')::date - 1, 'Past 1:1', 'p'),
  ('a0000000-0000-0000-0000-000000000002', (now() at time zone 'Asia/Kolkata')::date,     'Today 1:1', 't'),
  ('a0000000-0000-0000-0000-000000000003', (now() at time zone 'Asia/Kolkata')::date + 1, 'Tomorrow 1:1', 'f'),
  ('a0000000-0000-0000-0000-000000000004', (now() at time zone 'Asia/Kolkata')::date + 400, 'Far 1:1', 'f');
insert into public.verse_translations (verse_id, language_code, language_name, quote) values
  ('a0000000-0000-0000-0000-000000000002', 'kn', 'Kannada', 'today-kn'),
  ('a0000000-0000-0000-0000-000000000003', 'kn', 'Kannada', 'tomorrow-kn');

create or replace function pg_temp.expect_rows(sql text, n int, label text) returns void language plpgsql as $$
declare c int;
begin execute 'select count(*) from (' || sql || ') q' into c;
  if c <> n then raise exception 'FAIL: % expected % rows, got %', label, n, c; end if;
  raise notice 'PASS: %', label; end $$;

set role anon;
select pg_temp.expect_rows('select * from public.daily_verses', 2, 'anon sees only past and today');
select pg_temp.expect_rows($$select * from public.daily_verses where reference like 'Tomorrow%'$$, 0, 'anon cannot read tomorrow directly');
select pg_temp.expect_rows($$select * from public.daily_verses where reference like 'Far%'$$, 0, 'anon cannot read far-future verse');
select pg_temp.expect_rows('select * from public.verse_translations', 1, 'anon cannot read translations of future verses');
reset role;

set role authenticated; set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select pg_temp.expect_rows('select * from public.daily_verses', 2, 'signed-in non-admin sees only past and today');
reset role;

set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select pg_temp.expect_rows('select * from public.daily_verses', 4, 'admin sees every verse, including future ones');
select pg_temp.expect_rows('select * from public.verse_translations', 2, 'admin sees all translations');
select public.admin_save_verse(null, (now() at time zone 'Asia/Kolkata')::date + 30, 'Sched 1:1', 'x', '', null);
select pg_temp.expect_rows($$select * from public.daily_verses where reference='Sched 1:1'$$, 1, 'admin can still schedule a future verse');
reset role;
\echo ALL FUTURE-VERSE CHECKS PASSED
