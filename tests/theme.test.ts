import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/index.css', 'utf8');

function tokens(block: string): Record<string, [number, number, number]> {
  const out: Record<string, [number, number, number]> = {};
  for (const m of block.matchAll(/--([a-z-]+):\s*(\d+) (\d+) (\d+);/g)) out[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])];
  return out;
}
const light = tokens(css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {'))));
const darkStart = css.indexOf(":root[data-theme='dark'] {");
const dark = { ...light, ...tokens(css.slice(darkStart, css.indexOf('}', darkStart))) };

const lum = ([r, g, b]: number[]) => {
  const c = [r, g, b].map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const hex = (t: number[]) => '#' + t.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

describe('Linen & Sage palette', () => {
  it('uses the supplied core colours exactly', () => {
    expect(hex(light.paper)).toBe('#FBF9F5');
    expect(hex(light.surface)).toBe('#F2ECE1');
    expect(hex(light.ink)).toBe('#2C3E35');
    expect(hex(light.sage)).toBe('#6B8E78');
  });

  for (const [name, t] of [['light', light], ['dark', dark]] as const) {
    it(`meets WCAG AA for text pairs in the ${name} theme`, () => {
      for (const bg of ['paper', 'surface']) {
        expect(ratio(t.ink, t[bg])).toBeGreaterThanOrEqual(4.5);
        expect(ratio(t.muted, t[bg])).toBeGreaterThanOrEqual(4.5);
        expect(ratio(t.brand, t[bg])).toBeGreaterThanOrEqual(4.5); // links, small accent text
        expect(ratio(t.danger, t[bg])).toBeGreaterThanOrEqual(4.5);
      }
      expect(ratio(t['on-brand'], t.brand)).toBeGreaterThanOrEqual(4.5); // primary button text
    });
    it(`keeps the plain sage accent visible as a graphic/border (3:1) in the ${name} theme`, () => {
      expect(ratio(t.sage, t.paper)).toBeGreaterThanOrEqual(3);
      expect(ratio(t.sage, t.surface)).toBeGreaterThanOrEqual(3);
    });
  }
});

describe('social preview metadata', () => {
  const html = readFileSync('index.html', 'utf8');
  it('declares exactly one og:image, absolute, pointing at the 1200x630 JPEG', () => {
    const images = [...html.matchAll(/property="og:image"\s+content="([^"]+)"/g)].map((m) => m[1]);
    expect(images).toEqual(['https://ashwithfrank.github.io/daily-bible-verse/og-preview.jpg']);
    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('property="og:image:height" content="630"');
    expect(html.match(/name="twitter:card"/g)).toHaveLength(1);
    expect(html).toContain('summary_large_image');
  });
  it('declares each core Open Graph tag once', () => {
    for (const p of ['og:title', 'og:description', 'og:type', 'og:url']) {
      expect(html.match(new RegExp(`property="${p}"`, 'g')), p).toHaveLength(1);
    }
  });
});
