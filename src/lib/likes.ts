import { safeGet, safeSet } from './storage';

const KEY = 'aos-liked-verses-v1';

function read(): string[] {
  try {
    const parsed = JSON.parse(safeGet(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function isLiked(verseDate: string): boolean {
  return read().includes(verseDate);
}

/** Toggles and returns the new liked state. A set is used, so repeated clicks can never duplicate. */
export function toggleLike(verseDate: string): boolean {
  const set = new Set(read());
  const next = !set.has(verseDate);
  if (next) set.add(verseDate);
  else set.delete(verseDate);
  safeSet(KEY, JSON.stringify([...set]));
  return next;
}
