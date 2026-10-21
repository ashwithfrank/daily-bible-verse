-- Local RLS verification. Runs against a plain PostgreSQL with a minimal stand-in for Supabase's
-- auth schema and roles. Not for use on a real Supabase project (see README for the dashboard checks).
-- Usage: see supabase/tests/run_local_rls_check.sh
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
\i supabase/migrations/002_seed_demo.sql

insert into auth.users values ('11111111-1111-1111-1111-111111111111', 'admin@example.com'),
                              ('22222222-2222-2222-2222-222222222222', 'reader@example.com');
insert into public.admin_users values ('11111111-1111-1111-1111-111111111111');

create or replace function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then raise notice 'PASS (blocked): % [%]', label, sqlerrm; return; end;
  raise exception 'FAIL (was allowed): %', label;
end $$;
create or replace function pg_temp.expect_rows(sql text, n int, label text) returns void language plpgsql as $$
declare c int;
begin execute 'select count(*) from (' || sql || ') q' into c;
  if c <> n then raise exception 'FAIL: % expected % rows, got %', label, n, c; end if;
  raise notice 'PASS: %', label; end $$;
create or replace function pg_temp.expect_affected(sql text, n int, label text) returns void language plpgsql as $$
declare c int;
begin execute sql; get diagnostics c = row_count;
  if c <> n then raise exception 'FAIL: % expected % rows affected, got %', label, n, c; end if;
  raise notice 'PASS: %', label; end $$;

-- Anonymous visitor
set role anon;
select pg_temp.expect_rows('select * from public.daily_verses', 1, 'anon can read verses');
select pg_temp.expect_fail($$insert into public.daily_verses (verse_date, reference, english_quote) values ('2030-01-01','x','y')$$, 'anon cannot insert verse');
select pg_temp.expect_fail($$update public.daily_verses set reference='hacked'$$, 'anon cannot update verses');
select pg_temp.expect_fail($$delete from public.daily_verses$$, 'anon cannot delete verses');
select pg_temp.expect_fail($$select * from public.admin_users$$, 'anon cannot read admin list');
select pg_temp.expect_fail($$select public.admin_save_verse(null,'2030-01-01','x','y','',null)$$, 'anon cannot call admin_save_verse');
reset role;

-- Signed-in non-admin
set role authenticated; set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select pg_temp.expect_fail($$insert into public.daily_verses (verse_date, reference, english_quote) values ('2030-01-01','x','y')$$, 'non-admin cannot insert verse');
select pg_temp.expect_affected($$delete from public.daily_verses$$, 0, 'non-admin delete removes 0 rows');
select pg_temp.expect_fail($$select public.admin_save_verse(null,'2030-01-01','x','y','',null)$$, 'non-admin blocked in admin_save_verse');
select pg_temp.expect_rows('select * from public.admin_users', 0, 'non-admin sees no admin rows');
reset role;

-- Administrator
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select pg_temp.expect_rows('select * from public.admin_users', 1, 'admin sees own admin row');
select public.admin_save_verse(null, '2030-01-01', 'John 3:16', 'q', '', '[{"language_code":"kn","language_name":"Kannada","translation_name":"T","quote":"t","approved":true},{"language_code":"hi","language_name":"Hindi","translation_name":"","quote":"h","approved":false}]'::jsonb);
select pg_temp.expect_rows('select * from public.verse_translations', 2, 'admin sees all translations incl. unapproved');
select pg_temp.expect_fail($$select public.admin_save_verse(null,'2030-01-01','dup','y','',null)$$, 'duplicate date rejected');
select pg_temp.expect_fail($$select public.admin_save_verse(null,'2030-01-02','x','y','','[{"language_code":"kn","language_name":"K","translation_name":"","quote":"a"},{"language_code":"kn","language_name":"K","translation_name":"","quote":"b"}]'::jsonb)$$, 'duplicate translation version rejected');
select pg_temp.expect_rows($$select * from public.daily_verses where verse_date='2030-01-02'$$, 0, 'failed save rolled back completely');
-- edit: drop hindi, keep kannada by id
do $$ declare vid uuid; tid uuid; begin
  select id into vid from public.daily_verses where verse_date='2030-01-01';
  select id into tid from public.verse_translations where verse_id=vid and language_code='kn';
  perform public.admin_save_verse(vid,'2030-01-01','John 3:16 (edited)','q2','n', jsonb_build_array(jsonb_build_object('id',tid,'language_code','kn','language_name','Kannada','translation_name','T','quote','t2','approved',true)));
end $$;
select pg_temp.expect_rows('select * from public.verse_translations', 1, 'edit removed omitted translation, kept the other');
select pg_temp.expect_rows($$select * from public.daily_verses where reference='John 3:16 (edited)'$$, 1, 'edit updated in place (no duplicate)');
reset role;

-- Public sees only approved translations
set role anon;
select pg_temp.expect_rows('select * from public.verse_translations', 1, 'anon sees approved translation');
reset role;
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select pg_temp.expect_affected($$delete from public.daily_verses where verse_date='2030-01-01'$$, 1, 'admin can delete verse');
select pg_temp.expect_rows('select * from public.verse_translations', 0, 'translations cascade-deleted');
reset role;
\echo ALL RLS CHECKS PASSED
