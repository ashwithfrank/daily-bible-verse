-- AlphaOmega Studio — Daily Bible Verse: schema, RLS, helper functions
create extension if not exists pgcrypto;

-- ---------- Administrators ----------
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Admins may see who the admins are; nobody can write through the API.
create policy "admins read admin list" on public.admin_users
  for select to authenticated using (public.is_admin());

-- ---------- Verses ----------
create table public.daily_verses (
  id uuid primary key default gen_random_uuid(),
  verse_date date not null unique,
  reference text not null check (char_length(btrim(reference)) between 1 and 120),
  english_quote text not null check (char_length(btrim(english_quote)) between 1 and 4000),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null default auth.uid()
);
create index daily_verses_updated_idx on public.daily_verses (updated_at desc);

-- ---------- Translations ----------
-- Versioning: one row per (verse, language, translation_name). Several versions of the
-- same language (e.g. two Hindi Bibles) are different translation_name values.
create table public.verse_translations (
  id uuid primary key default gen_random_uuid(),
  verse_id uuid not null references public.daily_verses(id) on delete cascade,
  language_code text not null check (language_code ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$'),
  language_name text not null check (char_length(btrim(language_name)) between 1 and 60),
  translation_name text not null default '' check (char_length(translation_name) <= 120),
  quote text not null check (char_length(btrim(quote)) between 1 and 4000),
  source_url text check (source_url is null or source_url ~* '^https?://'),
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (verse_id, language_code, translation_name)
);
create index verse_translations_verse_idx on public.verse_translations (verse_id);

-- ---------- updated_at trigger ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger daily_verses_touch before update on public.daily_verses
  for each row execute function public.touch_updated_at();
create trigger verse_translations_touch before update on public.verse_translations
  for each row execute function public.touch_updated_at();

-- ---------- Row Level Security ----------
alter table public.daily_verses enable row level security;
alter table public.verse_translations enable row level security;

create policy "public read verses" on public.daily_verses
  for select to anon, authenticated using (true);
create policy "admin insert verses" on public.daily_verses
  for insert to authenticated with check (public.is_admin());
create policy "admin update verses" on public.daily_verses
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin delete verses" on public.daily_verses
  for delete to authenticated using (public.is_admin());

create policy "public read approved translations" on public.verse_translations
  for select to anon, authenticated using (approved or public.is_admin());
create policy "admin insert translations" on public.verse_translations
  for insert to authenticated with check (public.is_admin());
create policy "admin update translations" on public.verse_translations
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin delete translations" on public.verse_translations
  for delete to authenticated using (public.is_admin());

-- Least privilege at the grant level too
revoke all on public.daily_verses, public.verse_translations, public.admin_users from anon, authenticated;
grant select on public.daily_verses, public.verse_translations to anon;
grant select, insert, update, delete on public.daily_verses, public.verse_translations to authenticated;
grant select on public.admin_users to authenticated;
