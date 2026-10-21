import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';

// Mirrors src/main.tsx: the router basename comes from Vite's base with the trailing slash removed.
const BASE = '/daily-bible-verse/';
const basename = BASE.replace(/\/$/, '');

function renderAt(path: string) {
  window.history.pushState(null, '', path);
  return render(
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>,
  );
}

describe('routing under the GitHub Pages base path', () => {
  it('renders the public page at the base URL', async () => {
    renderAt('/daily-bible-verse/');
    expect(await screen.findByRole('heading', { name: /Daily Bible Verse/, hidden: true })).toBeInTheDocument();
  });

  it('renders a dated verse URL under the base', async () => {
    renderAt('/daily-bible-verse/2026-10-20');
    expect((await screen.findAllByText('Tuesday, October 20, 2026')).length).toBeGreaterThan(0);
  });

  it('renders the admin area (guarded) at /daily-bible-verse/admin, not the 404 page', async () => {
    renderAt('/daily-bible-verse/admin');
    // No Supabase variables in the test environment, so the guard shows the setup notice.
    expect(await screen.findByRole('alert')).toHaveTextContent(/Setup incomplete/);
    expect(screen.queryByText(/This page does not exist/)).not.toBeInTheDocument();
  });

  it('renders the admin login page under the base', async () => {
    renderAt('/daily-bible-verse/admin/login');
    expect(await screen.findByRole('heading', { name: 'Administrator sign in' })).toBeInTheDocument();
    // vitest's BASE_URL is '/', so this proves the src is built from BASE_URL rather than hard-coded.
    expect(document.querySelector('img')?.getAttribute('src')).toBe(`${import.meta.env.BASE_URL}aos-mark-small.png`);
  });
});
