export interface LanguageOption {
  code: string;
  name: string; // English name
  native: string; // shown in the selector
}

/** Add new languages here. They appear in the public selector and the admin form. */
export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
];

export const DEFAULT_LANGUAGE = 'en';

export function findLanguage(code: string): LanguageOption | undefined {
  return LANGUAGES.find((l) => l.code === code);
}
