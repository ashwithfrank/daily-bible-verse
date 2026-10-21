import { readFileSync } from 'node:fs';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/config', () => ({
  config: { timezone: 'Asia/Kolkata', siteUrl: 'https://example.org/daily-bible-verse', supabaseUrl: 'x', supabaseKey: 'y' },
  getConfigError: () => null,
}));

import { App } from '../src/App';
import { Footer } from '../src/components/Footer';
import { Header } from '../src/components/Header';
import { THEME_KEY } from '../src/lib/theme';

function mockMatchMedia(dark: boolean) {
  const listeners = new Set<() => void>();
  const mq = {
    get matches() { return dark; },
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  };
  window.matchMedia = vi.fn().mockReturnValue(mq) as unknown as typeof window.matchMedia;
  return { setDark: (v: boolean) => { dark = v; listeners.forEach((f) => f()); } };
}

const renderHeader = () => render(<MemoryRouter><Header /></MemoryRouter>);
const theme = () => document.documentElement.getAttribute('data-theme');

beforeEach(() => document.documentElement.removeAttribute('data-theme'));
afterEach(() => vi.restoreAllMocks());

describe('footer', () => {
  const renderFooter = () => render(<MemoryRouter><Footer /></MemoryRouter>);

  it('shows identity, tagline, the verse with its reference, credit and a dynamic year', () => {
    renderFooter();
    expect(screen.getByText('A little Scripture, a little peace, every day.')).toBeInTheDocument();
    expect(screen.getByText(/Your word is a lamp to my feet and a light to my path\./)).toBeInTheDocument();
    expect(screen.getByText('Psalm 119:105')).toBeInTheDocument();
    expect(screen.getByText('Made with ♥ by AlphaOmega Studio')).toBeInTheDocument();
    expect(screen.getByText(`© ${new Date().getFullYear()} AlphaOmega Studio. All rights reserved.`)).toBeInTheDocument();
  });

  it('computes the year at render time', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2031-06-01T00:00:00Z'));
    renderFooter();
    expect(screen.getByText(/© 2031 AlphaOmega Studio/)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('links to About and Privacy, and never to the admin area', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
    expect(document.querySelector('footer a[href*="admin"]')).toBeNull();
  });

  it('Share Website copies the site link when native sharing is unavailable, and confirms', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderFooter();
    await userEvent.click(screen.getByRole('button', { name: 'Share Website' }));
    expect(writeText).toHaveBeenCalledWith('https://example.org/daily-bible-verse/');
    expect(await screen.findByText('Website link copied to clipboard')).toBeInTheDocument();
  });

  it('Share Website reports failure helpfully when nothing works', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('no')) }, configurable: true });
    document.execCommand = vi.fn().mockReturnValue(false);
    renderFooter();
    await userEvent.click(screen.getByRole('button', { name: 'Share Website' }));
    expect(await screen.findByText(/Sharing is not available here/)).toBeInTheDocument();
  });

  it('uses the native share sheet on touch devices', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    renderFooter();
    await userEvent.click(screen.getByRole('button', { name: 'Share Website' }));
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://example.org/daily-bible-verse/' }));
    Reflect.deleteProperty(navigator, 'share');
  });
});

describe('About and Privacy pages', () => {
  const at = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

  it('About has its heading, content, a way home, and the footer', async () => {
    at('/about');
    expect(await screen.findByRole('heading', { level: 1, name: 'About Daily Bible Verse' })).toBeInTheDocument();
    expect(screen.getByText(/project by AlphaOmega Studio/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to today/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('Privacy covers the required sections, is truthful about storage, and links home', async () => {
    at('/privacy');
    expect(await screen.findByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
    for (const h of ['Overview', 'Information the website processes', 'How information is used', 'Storage in your browser', 'Third-party services', 'Data retention', 'Security and limitations', "Children's privacy", 'Changes to this policy', 'Questions']) {
      expect(screen.getByRole('heading', { level: 2, name: h })).toBeInTheDocument();
    }
    expect(screen.getByText(/dates of verses you have liked/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to today/ })).toHaveAttribute('href', '/');
  });

  it('the privacy text matches what the code actually does (no fabricated contact details)', async () => {
    at('/privacy');
    const text = (await screen.findByRole('main')).textContent ?? '';
    expect(text).not.toMatch(/@[a-z0-9.-]+\.[a-z]{2,}/i);
    expect(text).not.toMatch(/GDPR|CCPA|HIPAA|COPPA/i);
  });

  it('privacy facts hold in the source: likes are local-only, no analytics or cookies', () => {
    const src = ['src/lib/likes.ts', 'src/components/LikeButton.tsx'].map((f) => readFileSync(f, 'utf8')).join('\n');
    expect(src).not.toMatch(/supabase|fetch\(/);
    const all = ['src/lib', 'src/components', 'src/pages', 'src/hooks'].flatMap((d) => readdirRecursive(d)).filter((f) => !f.endsWith('PrivacyPage.tsx')).map((f) => readFileSync(f, 'utf8')).join('\n');
    expect(all).not.toMatch(/document\.cookie|gtag|googletagmanager|analytics|plausible|fbq\(/i);
  });
});

import { readdirSync, statSync } from 'node:fs';
function readdirRecursive(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = `${dir}/${n}`;
    return statSync(p).isDirectory() ? readdirRecursive(p) : /\.(ts|tsx)$/.test(p) ? [p] : [];
  });
}

describe('theme toggle', () => {
  it('sits in the header after the brand, with an accessible label and a 44px target', () => {
    mockMatchMedia(false);
    renderHeader();
    const header = screen.getByRole('banner');
    const home = screen.getByRole('link', { name: /AlphaOmega Studio — home/ });
    const toggle = screen.getByRole('button', { name: 'Switch to dark mode' });
    expect(header.contains(toggle)).toBe(true);
    expect(home.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(toggle.className).toMatch(/h-11/);
    expect(toggle.className).toMatch(/w-11/);
  });

  it('first visit follows the system preference (dark)', () => {
    mockMatchMedia(true);
    renderHeader();
    expect(theme()).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
  });

  it('toggles immediately and persists the explicit choice', async () => {
    mockMatchMedia(false);
    renderHeader();
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(theme()).toBe('dark');
    expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
    await userEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(theme()).toBe('light');
    expect(window.localStorage.getItem(THEME_KEY)).toBe('light');
  });

  it('an explicit choice beats the system preference on later visits', () => {
    mockMatchMedia(true); // system says dark
    window.localStorage.setItem(THEME_KEY, 'light');
    document.documentElement.removeAttribute('data-theme');
    renderHeader();
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument(); // currently light
  });

  it('follows system changes until a choice is made, then ignores them', async () => {
    const mm = mockMatchMedia(false);
    renderHeader();
    act(() => mm.setDark(true));
    await waitFor(() => expect(theme()).toBe('dark'));
    await userEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    act(() => mm.setDark(true));
    expect(theme()).toBe('light');
  });

  it('keeps working when storage is blocked', async () => {
    mockMatchMedia(false);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    renderHeader();
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(theme()).toBe('dark');
  });

  it('the theme stays the same when navigating between pages', async () => {
    mockMatchMedia(false);
    render(
      <MemoryRouter initialEntries={['/about']}>
        <Routes><Route path="*" element={<App />} /></Routes>
      </MemoryRouter>,
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Switch to dark mode' }));
    await userEvent.click(screen.getByRole('link', { name: 'Privacy Policy' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
    expect(theme()).toBe('dark');
  });

  describe('inline script in index.html (applies the theme before first paint)', () => {
    const script = /<script>\s*\/\/ Apply the saved[\s\S]*?<\/script>/.exec(readFileSync('index.html', 'utf8'))![0].replace(/<\/?script>/g, '');
    const run = (stored: string | null, systemDark: boolean, throwing = false) => {
      const attrs: Record<string, string> = {};
      const win = {
        localStorage: { getItem: () => { if (throwing) throw new Error('x'); return stored; } },
        matchMedia: () => ({ matches: systemDark }),
      };
      const doc = { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } };
      new Function('window', 'document', script)(win, doc);
      return attrs['data-theme'];
    };
    it('prefers a stored choice, else the system, and survives blocked storage', () => {
      expect(run('light', true)).toBe('light');
      expect(run('dark', false)).toBe('dark');
      expect(run(null, true)).toBe('dark');
      expect(run('garbage', false)).toBe('light');
      expect(run(null, true, true)).toBe('dark');
    });
  });
});
