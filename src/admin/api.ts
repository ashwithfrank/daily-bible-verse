import { getSupabase } from '../lib/supabase';
import type { TranslationInput, Verse, VerseInput, VerseSummary } from '../types';

export function friendlyError(err: { code?: string; message?: string } | null | undefined): string {
  if (!err) return 'Something went wrong.';
  switch (err.code) {
    case '23505':
      return 'A verse already exists for that date, or a translation with the same language and version is listed twice.';
    case '42501':
      return 'You are not authorized to make this change. Sign in with an administrator account.';
    case 'P0002':
      return 'This verse no longer exists. It may have been deleted.';
    case '23514':
    case '22023':
      return 'Some values are not allowed. Check the lengths and required fields.';
    default:
      return err.message || 'Something went wrong. Try again.';
  }
}

export class AdminError extends Error {}

function fail(error: { code?: string; message?: string }): never {
  throw new AdminError(friendlyError(error));
}

export interface Stats {
  total: number;
  thisMonth: number;
  upcoming: VerseSummary[];
  recent: VerseSummary[];
}

const SUMMARY = 'id, verse_date, reference, updated_at';

export async function fetchStats(today: string): Promise<Stats> {
  const db = getSupabase();
  const [y, m] = today.split('-').map(Number);
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const [total, month, upcoming, recent] = await Promise.all([
    db.from('daily_verses').select('id', { count: 'exact', head: true }),
    db.from('daily_verses').select('id', { count: 'exact', head: true }).gte('verse_date', start).lt('verse_date', nextMonth),
    db.from('daily_verses').select(SUMMARY).gte('verse_date', today).order('verse_date').limit(7),
    db.from('daily_verses').select(SUMMARY).order('updated_at', { ascending: false }).limit(5),
  ]);
  for (const r of [total, month, upcoming, recent]) if (r.error) fail(r.error);
  return { total: total.count ?? 0, thisMonth: month.count ?? 0, upcoming: (upcoming.data ?? []) as VerseSummary[], recent: (recent.data ?? []) as VerseSummary[] };
}

export interface ListQuery {
  search: string;
  date: string;
  sort: 'date-desc' | 'date-asc' | 'reference';
  page: number;
  pageSize: number;
}

export async function listVerses(q: ListQuery): Promise<{ rows: VerseSummary[]; total: number }> {
  let query = getSupabase().from('daily_verses').select(SUMMARY, { count: 'exact' });
  const term = q.search.trim().replace(/[\\%_,()]/g, (c) => `\\${c}`);
  if (term) query = query.ilike('reference', `%${term}%`);
  if (q.date) query = query.eq('verse_date', q.date);
  query = q.sort === 'reference' ? query.order('reference').order('verse_date') : query.order('verse_date', { ascending: q.sort === 'date-asc' });
  const from = (q.page - 1) * q.pageSize;
  const { data, count, error } = await query.range(from, from + q.pageSize - 1);
  if (error) fail(error);
  return { rows: (data ?? []) as VerseSummary[], total: count ?? 0 };
}

export async function getVerseById(id: string): Promise<VerseInput> {
  const { data, error } = await getSupabase()
    .from('daily_verses')
    .select('id, verse_date, reference, english_quote, notes, verse_translations(id, language_code, language_name, translation_name, quote, source_url, approved)')
    .eq('id', id)
    .maybeSingle();
  if (error) fail(error);
  if (!data) throw new AdminError('This verse was not found.');
  const v = data as unknown as Verse;
  return {
    id: v.id,
    verse_date: v.verse_date,
    reference: v.reference,
    english_quote: v.english_quote,
    notes: v.notes ?? '',
    translations: (v.verse_translations ?? []).map((t) => ({
      id: t.id,
      language_code: t.language_code,
      language_name: t.language_name,
      translation_name: t.translation_name,
      quote: t.quote,
      source_url: t.source_url ?? '',
      approved: t.approved ?? true,
    })),
  };
}

function cleanTranslation(t: TranslationInput) {
  return {
    id: t.id ?? null,
    language_code: t.language_code.trim(),
    language_name: t.language_name.trim(),
    translation_name: t.translation_name.trim(),
    quote: t.quote.trim(),
    source_url: t.source_url.trim(),
    approved: t.approved,
  };
}

/** Creates or updates a verse and replaces its translation set in one database transaction. */
export async function saveVerse(input: VerseInput): Promise<string> {
  const { data, error } = await getSupabase().rpc('admin_save_verse', {
    p_id: input.id ?? null,
    p_verse_date: input.verse_date,
    p_reference: input.reference.trim(),
    p_english_quote: input.english_quote.trim(),
    p_notes: input.notes.trim(),
    p_translations: input.translations.map(cleanTranslation),
  });
  if (error) fail(error);
  return data as string;
}

export async function deleteVerse(id: string): Promise<void> {
  const { data, error } = await getSupabase().from('daily_verses').delete().eq('id', id).select('id');
  if (error) fail(error);
  if (!data || data.length === 0) throw new AdminError('Nothing was deleted. You may not have permission, or the verse is already gone.');
}

export async function versesInRange(start: string, endExclusive: string): Promise<Map<string, string>> {
  const { data, error } = await getSupabase().from('daily_verses').select('id, verse_date').gte('verse_date', start).lt('verse_date', endExclusive);
  if (error) fail(error);
  return new Map((data ?? []).map((r: { id: string; verse_date: string }) => [r.verse_date, r.id]));
}

export async function existingDates(dates: string[]): Promise<Set<string>> {
  if (!dates.length) return new Set();
  const { data, error } = await getSupabase().from('daily_verses').select('verse_date').in('verse_date', dates);
  if (error) fail(error);
  return new Set((data ?? []).map((r: { verse_date: string }) => r.verse_date));
}

export async function bulkInsert(rows: { date: string; reference: string; english_quote: string }[]): Promise<number> {
  if (!rows.length) return 0;
  const { error } = await getSupabase()
    .from('daily_verses')
    .insert(rows.map((r) => ({ verse_date: r.date, reference: r.reference, english_quote: r.english_quote })));
  if (error) fail(error);
  return rows.length;
}
