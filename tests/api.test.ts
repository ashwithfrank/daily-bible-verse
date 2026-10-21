import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const chain: Record<string, unknown> = {};
const from = vi.fn(() => chain);
vi.mock('../src/lib/supabase', () => ({ getSupabase: () => ({ rpc, from }) }));

import { AdminError, deleteVerse, friendlyError, saveVerse } from '../src/admin/api';
import { getVerseByDate } from '../src/lib/verses';

const input = {
  verse_date: '2026-10-20',
  reference: ' Luke 12:40 ',
  english_quote: ' q ',
  notes: '',
  translations: [{ language_code: 'kn', language_name: 'Kannada', translation_name: ' V ', quote: ' t ', source_url: '', approved: true }],
};

beforeEach(() => {
  rpc.mockReset();
  from.mockClear();
  for (const k of Object.keys(chain)) delete chain[k];
});

describe('admin api', () => {
  it('saves a verse and its translations through one atomic RPC call, trimmed', async () => {
    rpc.mockResolvedValue({ data: 'id-1', error: null });
    expect(await saveVerse(input)).toBe('id-1');
    expect(rpc).toHaveBeenCalledWith('admin_save_verse', {
      p_id: null,
      p_verse_date: '2026-10-20',
      p_reference: 'Luke 12:40',
      p_english_quote: 'q',
      p_notes: '',
      p_translations: [{ id: null, language_code: 'kn', language_name: 'Kannada', translation_name: 'V', quote: 't', source_url: '', approved: true }],
    });
  });

  it('passes the id when editing', async () => {
    rpc.mockResolvedValue({ data: 'abc', error: null });
    await saveVerse({ ...input, id: 'abc' });
    expect(rpc.mock.calls[0][1].p_id).toBe('abc');
  });

  it('turns a permission failure (what RLS returns to a non-admin) into a clear error', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'not authorized' } });
    await expect(saveVerse(input)).rejects.toThrow(/not authorized to make this change/);
  });

  it('explains duplicate dates', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '23505', message: 'dup' } });
    await expect(saveVerse(input)).rejects.toThrow(/already exists for that date/);
  });

  it('treats a delete that removed zero rows as a failure (RLS hides rows from non-admins)', async () => {
    chain.delete = () => chain;
    chain.eq = () => chain;
    chain.select = () => Promise.resolve({ data: [], error: null });
    await expect(deleteVerse('x')).rejects.toBeInstanceOf(AdminError);
  });

  it('deletes by id when permitted', async () => {
    const eq = vi.fn(() => chain);
    chain.delete = () => chain;
    chain.eq = eq;
    chain.select = () => Promise.resolve({ data: [{ id: 'x' }], error: null });
    await deleteVerse('x');
    expect(from).toHaveBeenCalledWith('daily_verses');
    expect(eq).toHaveBeenCalledWith('id', 'x');
  });

  it('maps unknown errors to their message', () => {
    expect(friendlyError({ message: 'network down' })).toBe('network down');
  });
});

describe('public verse query', () => {
  it('requests only the one date, and returns null when nothing is scheduled', async () => {
    const eq = vi.fn(() => chain);
    chain.select = () => chain;
    chain.eq = eq;
    chain.maybeSingle = () => Promise.resolve({ data: null, error: null });
    expect(await getVerseByDate('2030-01-01')).toBeNull();
    expect(eq).toHaveBeenCalledWith('verse_date', '2030-01-01');
  });

  it('throws on database errors', async () => {
    chain.select = () => chain;
    chain.eq = () => chain;
    chain.maybeSingle = () => Promise.resolve({ data: null, error: { message: 'down' } });
    await expect(getVerseByDate('2030-01-01')).rejects.toThrow('down');
  });
});
