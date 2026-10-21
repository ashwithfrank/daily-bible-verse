-- Run ONCE in the Supabase SQL editor after creating the admin user under
-- Authentication -> Users -> Add user (tick "Auto Confirm User").
-- Replace the email below with that user's email.
insert into public.admin_users (user_id)
select id from auth.users where email = 'anilbantwal6@gmail.com'
on conflict do nothing;
