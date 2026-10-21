-- Optional demo content (replace through the admin dashboard).
-- Luke 12:40 text is the World English Bible (public domain).
insert into public.daily_verses (verse_date, reference, english_quote)
values ('2026-10-20', 'Luke 12:40',
  'You also must be ready, because the Son of Man will come at an hour when you do not expect him.')
on conflict (verse_date) do nothing;
