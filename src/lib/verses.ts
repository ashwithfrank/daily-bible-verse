import { getSupabase } from './supabase';
import type { Verse } from '../types';

const COLUMNS =
  'id, verse_date, reference, english_quote, verse_translations(id, language_code, language_name, translation_name, quote, source_url)';

/** Fetches exactly one verse (and its translations) for a date. Returns null when none is scheduled. */
export async function getVerseByDate(date: string): Promise<Verse | null> {
  const { data, error } = await getSupabase().from('daily_verses').select(COLUMNS).eq('verse_date', date).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Verse | null) ?? null;
}
