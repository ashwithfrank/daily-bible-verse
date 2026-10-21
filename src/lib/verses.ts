import { config } from './config';
import { isValidIsoDate, todayInTimezone } from './dates';
import { getSupabase } from './supabase';
import type { Verse } from '../types';

const COLUMNS =
  'id, verse_date, reference, english_quote, verse_translations(id, language_code, language_name, translation_name, quote, source_url)';

export class InvalidDateError extends Error {
  constructor() {
    super('That date is not valid.');
    this.name = 'InvalidDateError';
  }
}

export class FutureDateError extends Error {
  constructor(public readonly today: string) {
    super('Verses for future dates are not available yet.');
    this.name = 'FutureDateError';
  }
}

/**
 * Fetches exactly one verse (and its translations) for a date. Returns null when none is scheduled.
 *
 * Public readers may only see today and earlier. "Today" is the calendar date in the configured primary
 * timezone (Asia/Kolkata by default), never the visitor's device date. The check happens here, before
 * any request is made, and the query also carries `verse_date <= today` as a second guard.
 * Administrators use src/admin/api.ts, which has no such limit, so scheduling ahead still works.
 */
export async function getVerseByDate(date: string, now: Date = new Date()): Promise<Verse | null> {
  if (!isValidIsoDate(date)) throw new InvalidDateError();
  const today = todayInTimezone(config.timezone, now);
  if (date > today) throw new FutureDateError(today); // YYYY-MM-DD strings compare correctly as text
  const { data, error } = await getSupabase().from('daily_verses').select(COLUMNS).eq('verse_date', date).lte('verse_date', today).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Verse | null) ?? null;
}
