export interface Translation {
  id: string;
  language_code: string;
  language_name: string;
  translation_name: string;
  quote: string;
  source_url: string | null;
  approved?: boolean;
}

export interface Verse {
  id: string;
  verse_date: string; // YYYY-MM-DD
  reference: string;
  english_quote: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  verse_translations: Translation[];
}

export interface VerseSummary {
  id: string;
  verse_date: string;
  reference: string;
  updated_at: string;
}

export interface TranslationInput {
  id?: string;
  language_code: string;
  language_name: string;
  translation_name: string;
  quote: string;
  source_url: string;
  approved: boolean;
}

export interface VerseInput {
  id?: string;
  verse_date: string;
  reference: string;
  english_quote: string;
  notes: string;
  translations: TranslationInput[];
}
