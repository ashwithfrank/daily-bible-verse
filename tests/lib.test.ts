import { describe, expect, it, vi } from 'vitest';
import { addDays, formatLongDate, isValidIsoDate, todayInTimezone } from '../src/lib/dates';
import { buildShareText, shareVerse, stripOuterQuotes } from '../src/lib/share';
import { buildImportPreview, markExisting, parseCsv } from '../src/lib/csv';
import { validateVerseInput } from '../src/lib/validation';
import type { VerseInput } from '../src/types';

describe('dates', () => {
  it('computes today in the configured timezone, not the device timezone', () => {
    const instant = new Date('2026-10-19T20:00:00Z'); // 01:30 on the 20th in India
    expect(todayInTimezone('Asia/Kolkata', instant)).toBe('2026-10-20');
    expect(todayInTimezone('UTC', instant)).toBe('2026-10-19');
  });
  it('validates real calendar dates only', () => {
    expect(isValidIsoDate('2028-02-29')).toBe(true);
    expect(isValidIsoDate('2027-02-29')).toBe(false);
    expect(isValidIsoDate('2026-1-5')).toBe(false);
  });
  it('formats without timezone drift and adds days across month ends', () => {
    expect(formatLongDate('2026-10-20')).toBe('Tuesday, October 20, 2026');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });
});

describe('share text', () => {
  const base = { reference: 'Luke 12:40', quote: '\u201CBe ready.\u201D', dateIso: '2026-10-20', url: 'https://x.org/2026-10-20' };
  it('avoids doubled quotation marks', () => {
    expect(stripOuterQuotes('"Be ready."')).toBe('Be ready.');
    expect(buildShareText(base)).toContain('\n\u201CBe ready.\u201D\n');
  });
  it('includes reference, date, attribution and URL', () => {
    const t = buildShareText(base);
    expect(t.split('\n')).toEqual(['Luke 12:40', 'Tuesday, October 20, 2026', '', '\u201CBe ready.\u201D', '', 'Daily Bible Verse \u2014 AlphaOmega Studio', 'https://x.org/2026-10-20']);
  });
  it('uses native share on touch devices and treats cancel as cancelled', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('x', 'AbortError'));
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    expect(await shareVerse(base)).toBe('cancelled');
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: base.url }));
    Reflect.deleteProperty(navigator, 'share');
  });
});

describe('csv import', () => {
  it('parses quotes, commas, escaped quotes and CRLF', () => {
    const rows = parseCsv('\uFEFFdate,reference,english_quote\r\n2026-11-01,John 3:16,"For God, so ""loved"""\r\n');
    expect(rows[1]).toEqual(['2026-11-01', 'John 3:16', 'For God, so "loved"']);
  });
  it('reports invalid rows, in-file duplicates and existing dates; never marks them importable', () => {
    const { rows } = buildImportPreview(
      parseCsv('date,reference,english_quote\n2026-11-01,A 1:1,q\n2026-11-01,B 1:1,q\n2026-13-01,C 1:1,q\n2026-11-02,,q\n2026-11-03,D 1:1,q'),
    );
    expect(rows.map((r) => r.status)).toEqual(['ok', 'duplicate-in-file', 'invalid', 'invalid', 'ok']);
    const marked = markExisting(rows, new Set(['2026-11-03']));
    expect(marked.map((r) => r.status)).toEqual(['ok', 'duplicate-in-file', 'invalid', 'invalid', 'exists']);
  });
  it('rejects files without the required header', () => {
    expect(buildImportPreview(parseCsv('a,b\n1,2')).headerError).toMatch(/date, reference, english_quote/);
  });
});

describe('verse validation', () => {
  const ok: VerseInput = { verse_date: '2026-10-20', reference: 'Luke 12:40', english_quote: 'q', notes: '', translations: [] };
  it('accepts a complete verse', () => expect(validateVerseInput(ok)).toEqual({}));
  it('requires date, reference and quote', () => {
    const e = validateVerseInput({ ...ok, verse_date: '', reference: ' ', english_quote: '' });
    expect(Object.keys(e).sort()).toEqual(['english_quote', 'reference', 'verse_date']);
  });
  it('validates translations, source links and duplicate language/version pairs', () => {
    const t = { language_code: 'kn', language_name: 'Kannada', translation_name: 'A', quote: 'x', source_url: '', approved: true };
    const e = validateVerseInput({ ...ok, translations: [t, { ...t }, { ...t, translation_name: 'B', quote: '', source_url: 'ftp://x' }] });
    expect(e['t.1.language_code']).toMatch(/already listed/);
    expect(e['t.2.quote']).toBeTruthy();
    expect(e['t.2.source_url']).toBeTruthy();
  });
});
