import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { build404Html } from '../vite-plugins/spa-fallback';

/** Runs the inline <script> of an HTML string against a fake window.location. */
function inlineScript(html: string): string {
  const m = /<script>([\s\S]*?)<\/script>/.exec(html);
  if (!m) throw new Error('no inline script');
  return m[1];
}

function run404(base: string, url: string): string {
  const u = new URL(url);
  let target = '';
  const loc = { protocol: u.protocol, hostname: u.hostname, port: u.port, pathname: u.pathname, search: u.search, hash: u.hash, replace: (t: string) => (target = t) };
  new Function('window', `var window_ = window; ${inlineScript(build404Html(base)).replace(/window\.location/g, 'window.location')}`)({ location: loc });
  return target;
}

function runDecoder(url: string): string {
  const u = new URL(url);
  let result = '';
  const loc = { pathname: u.pathname, search: u.search, hash: u.hash };
  const win = { location: loc, history: { replaceState: (_a: unknown, _b: unknown, p: string) => (result = p) } };
  new Function('window', inlineScript(readFileSync('index.html', 'utf8')))(win);
  return result;
}

describe('GitHub Pages SPA fallback', () => {
  const base = '/daily-bible-verse/';
  const site = 'https://ashwithfrank.github.io';

  it('404.html keeps the repository segment and moves the route into the query', () => {
    expect(run404(base, `${site}/daily-bible-verse/admin`)).toBe(`${site}/daily-bible-verse/?/admin`);
    expect(run404(base, `${site}/daily-bible-verse/admin/verses/new?date=2026-11-05#top`)).toBe(
      `${site}/daily-bible-verse/?/admin/verses/new&date=2026-11-05#top`,
    );
  });

  it('index.html restores the original URL, so React Router sees /admin under its basename', () => {
    expect(runDecoder(`${site}/daily-bible-verse/?/admin`)).toBe('/daily-bible-verse/admin');
    expect(runDecoder(`${site}/daily-bible-verse/?/admin/verses/new&date=2026-11-05#top`)).toBe('/daily-bible-verse/admin/verses/new?date=2026-11-05#top');
  });

  it('round-trips a verse date URL with a language parameter', () => {
    const redirected = run404(base, `${site}/daily-bible-verse/2026-10-20?lang=kn`);
    expect(redirected).toBe(`${site}/daily-bible-verse/?/2026-10-20&lang=kn`);
    expect(runDecoder(redirected)).toBe('/daily-bible-verse/2026-10-20?lang=kn');
  });

  it('leaves normal URLs untouched', () => {
    expect(runDecoder(`${site}/daily-bible-verse/`)).toBe('');
    expect(runDecoder(`${site}/daily-bible-verse/?lang=kn`)).toBe('');
  });

  it('derives the segment count from the base (user site at root keeps none)', () => {
    expect(run404('/', 'https://example.org/admin')).toBe('https://example.org/?/admin');
  });
});
