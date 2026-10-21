import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ status: 'signedOut' as string, email: 'a@b.c', configError: null as string | null, signIn: vi.fn(), signOut: vi.fn() }));
vi.mock('../src/admin/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../src/lib/config', () => ({
  config: { timezone: 'Asia/Kolkata', siteUrl: 'https://example.org', supabaseUrl: 'x', supabaseKey: 'y' },
  getConfigError: () => null,
}));

const api = vi.hoisted(() => ({
  saveVerse: vi.fn(),
  getVerseById: vi.fn(),
  listVerses: vi.fn(),
  deleteVerse: vi.fn(),
}));
vi.mock('../src/admin/api', () => ({ ...api, fetchStats: vi.fn() }));

import { AdminGuard } from '../src/admin/AdminGuard';
import { VerseFormPage } from '../src/admin/VerseFormPage';
import { VersesPage } from '../src/admin/VersesPage';

beforeEach(() => Object.values(api).forEach((f) => f.mockReset()));

describe('admin route protection', () => {
  const renderGuard = () =>
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin/login" element={<p>Login screen</p>} />
          <Route path="/admin" element={<AdminGuard />}>
            <Route index element={<p>Secret dashboard</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

  it('redirects signed-out visitors to the login page', () => {
    auth.status = 'signedOut';
    renderGuard();
    expect(screen.getByText('Login screen')).toBeInTheDocument();
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument();
  });
  it('blocks signed-in users who are not administrators', () => {
    auth.status = 'notAdmin';
    renderGuard();
    expect(screen.getByRole('alert')).toHaveTextContent(/not an administrator/);
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument();
  });
  it('shows nothing private while the session is being checked', () => {
    auth.status = 'loading';
    renderGuard();
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument();
  });
  it('lets administrators in', () => {
    auth.status = 'admin';
    renderGuard();
    expect(screen.getByText('Secret dashboard')).toBeInTheDocument();
  });
});

describe('verse form', () => {
  const renderForm = (path = '/admin/verses/new?date=2026-11-05') =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/verses" element={<p>Verse list</p>} />
          <Route path="/admin/verses/new" element={<VerseFormPage />} />
          <Route path="/admin/verses/:id" element={<VerseFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

  it('blocks saving and shows field errors when required fields are empty', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(/Enter the Bible reference/)).toBeInTheDocument();
    expect(screen.getByText(/Enter the English quotation/)).toBeInTheDocument();
    expect(screen.getByLabelText('Bible reference')).toHaveAttribute('aria-invalid', 'true');
    expect(api.saveVerse).not.toHaveBeenCalled();
  });

  it('creates a verse with a translation', async () => {
    api.saveVerse.mockResolvedValue('new-id');
    renderForm();
    await userEvent.type(screen.getByLabelText('Bible reference'), 'John 3:16');
    await userEvent.type(screen.getByLabelText('Original English quotation'), 'For God so loved the world.');
    await userEvent.click(screen.getByRole('button', { name: /Add translation/ }));
    await userEvent.type(screen.getByLabelText('Translation quotation'), 'ಅನುವಾದ');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.saveVerse).toHaveBeenCalledTimes(1));
    const sent = api.saveVerse.mock.calls[0][0];
    expect(sent).toMatchObject({ verse_date: '2026-11-05', reference: 'John 3:16' });
    expect(sent.id).toBeUndefined();
    expect(sent.translations[0]).toMatchObject({ language_code: 'kn', quote: 'ಅನುವಾದ' });
    expect(await screen.findByText('Verse list')).toBeInTheDocument();
  });

  it('"Save and add another" resets the form for the next day', async () => {
    api.saveVerse.mockResolvedValue('id1');
    renderForm();
    await userEvent.type(screen.getByLabelText('Bible reference'), 'Psalm 23:1');
    await userEvent.type(screen.getByLabelText('Original English quotation'), 'The LORD is my shepherd.');
    await userEvent.click(screen.getByRole('button', { name: 'Save and add another' }));
    expect(await screen.findByText(/Saved Psalm 23:1/)).toBeInTheDocument();
    expect(screen.getByLabelText('Bible reference')).toHaveValue('');
    expect(screen.getByLabelText('Date')).toHaveValue('2026-11-06');
  });

  it('edits an existing verse, updating by id rather than creating a duplicate', async () => {
    api.getVerseById.mockResolvedValue({ id: 'abc', verse_date: '2026-11-05', reference: 'Old 1:1', english_quote: 'old', notes: '', translations: [] });
    api.saveVerse.mockResolvedValue('abc');
    renderForm('/admin/verses/abc');
    const ref = await screen.findByLabelText('Bible reference');
    await userEvent.clear(ref);
    await userEvent.type(ref, 'New 2:2');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.saveVerse).toHaveBeenCalled());
    expect(api.saveVerse.mock.calls[0][0]).toMatchObject({ id: 'abc', reference: 'New 2:2' });
  });

  it('shows the server error when saving fails', async () => {
    api.saveVerse.mockRejectedValue(new Error('A verse already exists for that date.'));
    renderForm();
    await userEvent.type(screen.getByLabelText('Bible reference'), 'X 1:1');
    await userEvent.type(screen.getByLabelText('Original English quotation'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');
  });
});

describe('verse list', () => {
  it('asks for confirmation before deleting, and cancel deletes nothing', async () => {
    api.listVerses.mockResolvedValue({ rows: [{ id: 'v1', verse_date: '2026-10-20', reference: 'Luke 12:40', updated_at: '' }], total: 1 });
    api.deleteVerse.mockResolvedValue(undefined);
    render(<MemoryRouter><VersesPage /></MemoryRouter>);
    await userEvent.click(await screen.findByRole('button', { name: /Delete Luke 12:40/ }));
    const dialog = screen.getByRole('alertdialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(api.deleteVerse).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /Delete Luke 12:40/ }));
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete verse' }));
    await waitFor(() => expect(api.deleteVerse).toHaveBeenCalledWith('v1'));
    expect(await screen.findByText(/Deleted Luke 12:40/)).toBeInTheDocument();
  });
});
