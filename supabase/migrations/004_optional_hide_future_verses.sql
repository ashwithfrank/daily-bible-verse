-- OPTIONAL hardening. Not required for the website to work: the public site already refuses future dates
-- in its own code. This makes the DATABASE enforce it too, so nobody can read tomorrow's verse by calling
-- the Supabase REST API directly with the public key.
--
-- Effect: anonymous visitors (and signed-in non-admins) only see verses dated today or earlier, where
-- "today" is the calendar date in Asia/Kolkata. Administrators still see and manage everything.
-- Change 'Asia/Kolkata' below if you change VITE_PRIMARY_TIMEZONE.
-- No tables, columns or rows are changed; only the two read policies are replaced.

drop policy if exists "public read verses" on public.daily_verses;
create policy "public read released verses" on public.daily_verses
  for select to anon, authenticated
  using (verse_date <= (now() at time zone 'Asia/Kolkata')::date or public.is_admin());

-- Translations follow their verse: the subquery runs under the verse table's policy above.
drop policy if exists "public read approved translations" on public.verse_translations;
create policy "public read approved translations" on public.verse_translations
  for select to anon, authenticated
  using (
    public.is_admin()
    or (approved and exists (select 1 from public.daily_verses v where v.id = verse_id))
  );
