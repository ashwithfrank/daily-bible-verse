import { isValidIsoDate } from './dates';
import type { VerseInput } from '../types';

export type Errors = Record<string, string>;

export function validateVerseInput(v: VerseInput): Errors {
  const e: Errors = {};
  if (!v.verse_date) e.verse_date = 'Choose a date.';
  else if (!isValidIsoDate(v.verse_date)) e.verse_date = 'Enter a valid date.';
  if (!v.reference.trim()) e.reference = 'Enter the Bible reference, for example Luke 12:40.';
  else if (v.reference.trim().length > 120) e.reference = 'Reference must be 120 characters or fewer.';
  if (!v.english_quote.trim()) e.english_quote = 'Enter the English quotation.';
  else if (v.english_quote.trim().length > 4000) e.english_quote = 'Quotation must be 4000 characters or fewer.';
  if (v.notes.length > 2000) e.notes = 'Notes must be 2000 characters or fewer.';

  const seen = new Set<string>();
  v.translations.forEach((t, i) => {
    if (!t.language_code) e[`t.${i}.language_code`] = 'Choose a language.';
    if (!t.quote.trim()) e[`t.${i}.quote`] = 'Enter the translated quotation.';
    else if (t.quote.trim().length > 4000) e[`t.${i}.quote`] = 'Quotation must be 4000 characters or fewer.';
    if (t.source_url.trim() && !/^https?:\/\/\S+$/i.test(t.source_url.trim())) e[`t.${i}.source_url`] = 'Source link must start with http:// or https://.';
    const key = `${t.language_code}|${t.translation_name.trim().toLowerCase()}`;
    if (t.language_code && seen.has(key)) e[`t.${i}.language_code`] = 'This language and version is already listed. Use a different version name.';
    seen.add(key);
  });
  return e;
}
