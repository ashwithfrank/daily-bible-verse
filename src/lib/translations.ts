import type { Translation, Verse } from '../types';
import { findLanguage } from './languages';

/**
 * Translation-provider abstraction.
 * v1 ships with DatabaseTranslationProvider (admin-entered, reviewed text).
 * To add a licensed Bible API later, implement TranslationProvider on a trusted
 * server (e.g. a Supabase Edge Function that holds the API key), store the result in
 * verse_translations, and keep the browser reading from the database only.
 */
export interface TranslationProvider {
  readonly id: string;
  getTranslations(verse: Verse): Translation[];
}

export const DatabaseTranslationProvider: TranslationProvider = {
  id: 'database',
  getTranslations: (verse) => verse.verse_translations ?? [],
};

export function translationsFor(verse: Verse, languageCode: string, provider: TranslationProvider = DatabaseTranslationProvider): Translation[] {
  return provider.getTranslations(verse).filter((t) => t.language_code === languageCode);
}

export function languagesWithTranslations(verse: Verse): Set<string> {
  return new Set(DatabaseTranslationProvider.getTranslations(verse).map((t) => t.language_code));
}

export function translationLabel(t: Translation): string {
  const lang = findLanguage(t.language_code)?.name ?? t.language_name;
  return t.translation_name ? `${lang} \u2014 ${t.translation_name}` : lang;
}
