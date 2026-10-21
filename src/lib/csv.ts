import { isValidIsoDate } from './dates';

/** Minimal RFC 4180 parser: quoted fields, escaped quotes, CRLF/LF, BOM. */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}

export interface ImportRow {
  line: number;
  date: string;
  reference: string;
  english_quote: string;
  status: 'ok' | 'invalid' | 'duplicate-in-file' | 'exists';
  message: string;
}

export const MAX_IMPORT_ROWS = 500;

export function buildImportPreview(rows: string[][]): { rows: ImportRow[]; headerError?: string } {
  if (!rows.length) return { rows: [], headerError: 'The file is empty.' };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = { date: header.indexOf('date'), reference: header.indexOf('reference'), quote: header.indexOf('english_quote') };
  if (idx.date < 0 || idx.reference < 0 || idx.quote < 0) {
    return { rows: [], headerError: 'The first row must contain the columns: date, reference, english_quote.' };
  }
  const body = rows.slice(1);
  if (body.length > MAX_IMPORT_ROWS) return { rows: [], headerError: `Import at most ${MAX_IMPORT_ROWS} rows at a time.` };
  const seen = new Set<string>();
  const out: ImportRow[] = body.map((r, i) => {
    const date = (r[idx.date] ?? '').trim();
    const reference = (r[idx.reference] ?? '').trim();
    const english_quote = (r[idx.quote] ?? '').trim();
    const base = { line: i + 2, date, reference, english_quote };
    if (!isValidIsoDate(date)) return { ...base, status: 'invalid', message: 'Date must be a real date written as YYYY-MM-DD.' };
    if (!reference) return { ...base, status: 'invalid', message: 'Reference is required.' };
    if (reference.length > 120) return { ...base, status: 'invalid', message: 'Reference is longer than 120 characters.' };
    if (!english_quote) return { ...base, status: 'invalid', message: 'English quote is required.' };
    if (english_quote.length > 4000) return { ...base, status: 'invalid', message: 'English quote is longer than 4000 characters.' };
    if (seen.has(date)) return { ...base, status: 'duplicate-in-file', message: 'This date appears earlier in the file.' };
    seen.add(date);
    return { ...base, status: 'ok', message: 'Ready to import.' };
  });
  return { rows: out };
}

/** Marks rows whose date already has a verse in the database. They are never overwritten. */
export function markExisting(rows: ImportRow[], existing: Set<string>): ImportRow[] {
  return rows.map((r) => (r.status === 'ok' && existing.has(r.date) ? { ...r, status: 'exists', message: 'A verse already exists for this date. It will be skipped.' } : r));
}
