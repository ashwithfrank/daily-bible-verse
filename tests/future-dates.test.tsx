import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getVerse = vi.fn();
vi.mock('../src/lib/config', () => ({
  config: { timezone: 'Asia/Kolkata', siteUrl: 'https://example.org', supabaseUrl: 'x', supabaseKey: 'y' },
  getConfigError: () => null,
}));
vi.mock('../src/lib/dates', async (orig) => ({ ...(await orig<typeof import('../src/lib/dates')>()), todayInTimezone: () => '2026-10-21' }));
vi.mock('../src/lib/verses', async (orig) => ({ ...(await orig<typeof import('../src/lib/verses')>()), getVerseByDate: (d: string) => getVerse(d) }));
import { HomePage } from '../src/pages/HomePage';

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
const verse = (d: string) => ({ id: d, verse_date: d, reference: 'Luke 12:40', english_quote: 'Be ready.', verse_translations: [] });

describe('public page and future dates', () => {
  beforeEach(() => getVerse.mockReset().mockImplementation(async (d: string) => verse(d)));

  it('shows today, and disables the next-day control and the date input beyond today', async () => {
    renderAt('/');
    expect(await screen.findByText(/Be ready\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next day' })).toBeDisabled();
    expect(screen.getByLabelText('Choose a date')).toHaveAttribute('max', '2026-10-21');
  });

  it('allows going back a day', async () => {
    renderAt('/');
    await userEvent.click(await screen.findByRole('button', { name: 'Previous day' }));
    expect(await screen.findByText('Tuesday, October 20, 2026')).toBeInTheDocument();
    expect(getVerse).toHaveBeenLastCalledWith('2026-10-20');
  });

  it.each(['/2026-10-22', '/2027-01-01', '/2099-12-31'])('a future date in the URL (%s) shows a message and never loads the verse', async (path) => {
    renderAt(path);
    expect(await screen.findByText(/future dates are not available yet/)).toBeInTheDocument();
    expect(screen.queryByText(/Be ready\./)).not.toBeInTheDocument();
    expect(getVerse).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /Go to today/ })).toBeInTheDocument();
  });

  it('the "Go to today" button returns to today', async () => {
    renderAt('/2099-01-01');
    await userEvent.click(await screen.findByRole('link', { name: /Go to today/ }));
    expect(await screen.findByText(/Be ready\./)).toBeInTheDocument();
    expect(getVerse).toHaveBeenCalledWith('2026-10-21');
  });

  it('a future date with a language parameter cannot bypass the restriction', async () => {
    renderAt('/2026-10-22?lang=kn');
    expect(await screen.findByText(/future dates are not available yet/)).toBeInTheDocument();
    expect(getVerse).not.toHaveBeenCalled();
  });

  it('typing a future date into the picker is clamped to today', async () => {
    renderAt('/2026-10-20');
    await screen.findByText(/Be ready\./);
    const input = screen.getByLabelText('Choose a date') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, '2030-05-05');
    expect(screen.getByTestId('where').textContent).not.toContain('2030');
    expect(getVerse).not.toHaveBeenCalledWith('2030-05-05');
  });

  it('an impossible date still shows the invalid-date message', async () => {
    renderAt('/2026-02-31');
    expect(await screen.findByText(/That date is not valid/)).toBeInTheDocument();
    expect(getVerse).not.toHaveBeenCalled();
  });
});
