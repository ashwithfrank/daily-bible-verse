import { safeGet, safeSet } from './storage';

export type Theme = 'light' | 'dark';

export const THEME_KEY = 'aos-theme';
export const THEME_COLORS: Record<Theme, string> = { light: '#FBF9F5', dark: '#18211D' };

export function systemTheme(): Theme {
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/** The visitor's explicit choice, or null if they have never chosen (then the system preference applies). */
export function storedTheme(): Theme | null {
  const v = safeGet(THEME_KEY);
  return v === 'light' || v === 'dark' ? v : null;
}

export function resolveTheme(): Theme {
  return storedTheme() ?? systemTheme();
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
}

export function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'dark' || attr === 'light' ? attr : resolveTheme();
}

/** Records an explicit choice (best effort: if storage is blocked the choice still applies for this visit). */
export function chooseTheme(theme: Theme): void {
  applyTheme(theme);
  safeSet(THEME_KEY, theme);
}
