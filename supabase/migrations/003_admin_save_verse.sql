-- Atomic save of a verse together with its translations.
-- SECURITY INVOKER: Row Level Security still applies; the explicit is_admin() check
-- gives a clear error for non-admins.
create or replace function public.admin_save_verse(
  p_id uuid,
  p_verse_date date,
  p_reference text,
  p_english_quote text,
  p_notes text,
  p_translations jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
  t jsonb;
  t_id uuid;
  kept uuid[] := '{}';
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_verse_date is null or coalesce(btrim(p_reference), '') = '' or coalesce(btrim(p_english_quote), '') = '' then
    raise exception 'date, reference and quote are required' using errcode = '22023';
  end if;

  if p_id is null then
    insert into daily_verses (verse_date, reference, english_quote, notes)
    values (p_verse_date, btrim(p_reference), btrim(p_english_quote), nullif(btrim(coalesce(p_notes, '')), ''))
    returning id into v_id;
  else
    update daily_verses
       set verse_date = p_verse_date, reference = btrim(p_reference),
           english_quote = btrim(p_english_quote), notes = nullif(btrim(coalesce(p_notes, '')), '')
     where id = p_id
     returning id into v_id;
    if v_id is null then
      raise exception 'verse not found' using errcode = 'P0002';
    end if;
  end if;

  for t in select * from jsonb_array_elements(coalesce(p_translations, '[]'::jsonb)) loop
    t_id := nullif(t->>'id', '')::uuid;
    if t_id is not null then
      update verse_translations
         set language_code = btrim(t->>'language_code'),
             language_name = btrim(t->>'language_name'),
             translation_name = btrim(coalesce(t->>'translation_name', '')),
             quote = btrim(t->>'quote'),
             source_url = nullif(btrim(coalesce(t->>'source_url', '')), ''),
             approved = coalesce((t->>'approved')::boolean, true)
       where id = t_id and verse_id = v_id;
    else
      insert into verse_translations (verse_id, language_code, language_name, translation_name, quote, source_url, approved)
      values (v_id, btrim(t->>'language_code'), btrim(t->>'language_name'),
              btrim(coalesce(t->>'translation_name', '')), btrim(t->>'quote'),
              nullif(btrim(coalesce(t->>'source_url', '')), ''),
              coalesce((t->>'approved')::boolean, true))
      returning id into t_id;
    end if;
    kept := kept || t_id;
  end loop;

  delete from verse_translations where verse_id = v_id and not (id = any(kept));
  return v_id;
end;
$$;
revoke all on function public.admin_save_verse(uuid, date, text, text, text, jsonb) from public, anon;
grant execute on function public.admin_save_verse(uuid, date, text, text, text, jsonb) to authenticated;
