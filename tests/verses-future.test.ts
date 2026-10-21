import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateVerseInput } from '../src/lib/validation';

// ---- unit: the loader refuses future dates before touching the database ----
const from = vi.fn();
const chain: Record<string, unknown> = {};
vi.mock('../src/lib/supabase', () => ({ getSupabase: () => ({ from }) }));
import { FutureDateError, InvalidDateError, getVerseByDate } from '../src/lib/verses';

const NOW = new Date('2026-10-20T18:30:00Z'); // 00:00 on 2026-10-21 in India

describe('getVerseByDate', () => {
  const eq = vi.fn();
  const lte = vi.fn();
  beforeEach(() => {
    from.mockReset().mockReturnValue(chain);
    eq.mockReset().mockReturnValue(chain);
    lte.mockReset().mockReturnValue(chain);
    chain.select = () => chain;
    chain.eq = eq;
    chain.lte = lte;
    chain.maybeSingle = () => Promise.resolve({ data: { id: 'v', verse_date: 'x' }, error: null });
  });

  it('allows today and constrains the query to <= today', async () => {
    await getVerseByDate('2026-10-21', NOW);
    expect(eq).toHaveBeenCalledWith('verse_date', '2026-10-21');
    expect(lte).toHaveBeenCalledWith('verse_date', '2026-10-21');
  });
  it('allows previous dates', async () => {
    await expect(getVerseByDate('2026-10-01', NOW)).resolves.toBeTruthy();
    await expect(getVerseByDate('2020-02-29', NOW)).resolves.toBeTruthy();
  });
  it('rejects tomorrow without querying', async () => {
    await expect(getVerseByDate('2026-10-22', NOW)).rejects.toBeInstanceOf(FutureDateError);
    expect(from).not.toHaveBeenCalled();
  });
  it('rejects dates far in the future without querying', async () => {
    await expect(getVerseByDate('2099-12-31', NOW)).rejects.toBeInstanceOf(FutureDateError);
    expect(from).not.toHaveBeenCalled();
  });
  it('treats the India midnight boundary correctly', async () => {
    const justBefore = new Date('2026-10-20T18:29:59Z'); // still the 20th in India
    await expect(getVerseByDate('2026-10-21', justBefore)).rejects.toBeInstanceOf(FutureDateError);
    await expect(getVerseByDate('2026-10-21', new Date('2026-10-20T18:30:00Z'))).resolves.toBeTruthy();
  });
  it('rejects invalid inputs gracefully', async () => {
    for (const bad of ['', 'abc', '2026-13-01', '2026-02-30', '2026-1-5', "2026-10-20'; drop table"]) {
      await expect(getVerseByDate(bad, NOW)).rejects.toBeInstanceOf(InvalidDateError);
    }
    expect(from).not.toHaveBeenCalled();
  });
});

describe('administrators can still schedule ahead', () => {
  it('form validation accepts a future-dated verse', () => {
    expect(validateVerseInput({ verse_date: '2099-01-01', reference: 'John 3:16', english_quote: 'q', notes: '', translations: [] })).toEqual({});
  });
});

