import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from '../src/pages/HomePage';
import type { Verse } from '../src/types';

vi.mock('../src/lib/config', () => ({
  config: { timezone: 'Asia/Kolkata', siteUrl: 'https://example.org', supabaseUrl: 'x', supabaseKey: 'y' },
  getConfigError: () => null,
}));
vi.mock('../src/lib/dates', async (orig) => ({ ...(await orig<typeof import('../src/lib/dates')>()), todayInTimezone: () => '2026-10-20' }));
const getVerseByDate = vi.fn();
vi.mock('../src/lib/verses', () => ({ getVerseByDate: (d: string) => getVerseByDate(d) }));

const QUOTE = 'You also must be ready, because the Son of Man will come at an hour when you do not expect him.';
const verse = (date: string, extra: Partial<Verse> = {}): Verse => ({
  id: date,
  verse_date: date,
  reference: 'Luke 12:40',
  english_quote: QUOTE,
  verse_translations: [{ id: 't1', language_code: 'kn', language_name: 'Kannada', translation_name: 'Test KN', quote: 'ಕನ್ನಡ ಪಠ್ಯ', source_url: null }],
  ...extra,
});

function Where() {
  const l = useLocation();
  return <output data-testid="where">{l.pathname + l.search}</output>;
}
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:date" element={<HomePage />} />
      </Routes>
      <Where />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  getVerseByDate.mockReset();
  getVerseByDate.mockImplementation(async (d: string) => (d === '2026-10-20' || d === '2026-10-19' ? verse(d) : null));
});

describe('public verse page', () => {
  it('loads the verse for the current date in the primary timezone', async () => {
    renderAt('/');
    expect(await screen.findByText(/You also must be ready/)).toBeInTheDocument();
    expect(getVerseByDate).toHaveBeenCalledWith('2026-10-20');
    expect(screen.getByRole('heading', { name: 'Luke 12:40' })).toBeInTheDocument();
    expect(screen.getByText('Tuesday, October 20, 2026')).toBeInTheDocument();
  });

  it('loads an earlier date chosen with the previous-day control', async () => {
    renderAt('/');
    await screen.findByText(/You also must be ready/);
    await userEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    await waitFor(() => expect(getVerseByDate).toHaveBeenCalledWith('2026-10-19'));
    expect(await screen.findByText('Monday, October 19, 2026')).toBeInTheDocument();
    expect(screen.getByTestId('where')).toHaveTextContent('/2026-10-19');
  });

  it('shows a friendly message, not another verse, when the date has no verse', async () => {
    renderAt('/2026-10-05');
    expect(await screen.findByText(/No verse has been scheduled for this date yet/)).toBeInTheDocument();
    expect(screen.queryByText(/You also must be ready/)).not.toBeInTheDocument();
  });

  it('rejects an impossible date in the URL without querying the database', async () => {
    renderAt('/2026-02-31');
    expect(await screen.findByText(/That date is not valid/)).toBeInTheDocument();
    expect(getVerseByDate).not.toHaveBeenCalled();
  });

  it('switches language, shows the translation label, and keeps the selected date', async () => {
    renderAt('/2026-10-19');
    await screen.findByText(/You also must be ready/);
    await userEvent.selectOptions(screen.getByLabelText('Language'), 'kn');
    expect(await screen.findByText(/ಕನ್ನಡ ಪಠ್ಯ/)).toBeInTheDocument();
    expect(screen.getByText('Kannada — Test KN')).toBeInTheDocument();
    expect(screen.getByText('Monday, October 19, 2026')).toBeInTheDocument();
    expect(screen.getByTestId('where')).toHaveTextContent('/2026-10-19?lang=kn');
    expect(getVerseByDate).toHaveBeenCalledTimes(1); // no refetch on language change
  });

  it('says so when a language has no translation, and still shows the English original', async () => {
    renderAt('/2026-10-19?lang=ta');
    expect(await screen.findByText(/No reviewed Tamil translation is available/)).toBeInTheDocument();
    expect(screen.getByText(/You also must be ready/)).toBeInTheDocument();
  });

  it('shows an error state with retry when the database fails', async () => {
    getVerseByDate.mockRejectedValueOnce(new Error('boom'));
    renderAt('/');
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be loaded/);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(/You also must be ready/)).toBeInTheDocument();
  });

  it('likes and unlikes a verse and remembers it after a reload', async () => {
    const { unmount } = renderAt('/');
    const like = await screen.findByRole('button', { name: /Like/ });
    expect(like).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(like);
    expect(screen.getByRole('button', { name: /Liked/ })).toHaveAttribute('aria-pressed', 'true');
    unmount();
    renderAt('/');
    expect(await screen.findByRole('button', { name: /Liked/ })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: /Liked/ }));
    expect(screen.getByRole('button', { name: /Like$/ })).toHaveAttribute('aria-pressed', 'false');
    expect(JSON.parse(window.localStorage.getItem('aos-liked-verses-v1')!)).toEqual([]);
  });

  it('keeps working when browser storage throws', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    renderAt('/');
    await userEvent.click(await screen.findByRole('button', { name: /Like/ }));
    expect(screen.getByText(/You also must be ready/)).toBeInTheDocument();
    spy.mockRestore();
  });

  it('shares the displayed translation, selected date and URL (clipboard fallback)', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderAt('/2026-10-19?lang=kn');
    await userEvent.click(await screen.findByRole('button', { name: 'Share' }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const text = writeText.mock.calls[0][0] as string;
    expect(text).toContain('Luke 12:40');
    expect(text).toContain('Monday, October 19, 2026');
    expect(text).toContain('\u201Cಕನ್ನಡ ಪಠ್ಯ\u201D');
    expect(text).toContain('(Kannada — Test KN)');
    expect(text).toContain('https://example.org/2026-10-19?lang=kn');
    expect(await screen.findByText('Verse copied to clipboard')).toBeInTheDocument();
  });
});
