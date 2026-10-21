import { formatLongDate } from './dates';

export interface ShareInput {
  reference: string;
  quote: string;
  dateIso: string;
  url: string;
  translationLabel?: string; // e.g. "Kannada — KJV"; omitted for English original
}

/** Removes wrapping quotation marks so the shared text never has doubled quotes. */
export function stripOuterQuotes(text: string): string {
  return text.trim().replace(/^[\u201C\u201D"«„]+\s*/, '').replace(/\s*[\u201C\u201D"»]+$/, '');
}

export function buildShareText(i: ShareInput): string {
  const lines = [i.reference, formatLongDate(i.dateIso), '', `\u201C${stripOuterQuotes(i.quote)}\u201D`];
  if (i.translationLabel) lines.push(`(${i.translationLabel})`);
  lines.push('', 'Daily Bible Verse \u2014 AlphaOmega Studio', i.url);
  return lines.join('\n');
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

function prefersNativeShare(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

interface Payload {
  title: string;
  text: string; // shared as body text (without the URL)
  url: string;
  clipboardText: string; // what to copy when native sharing is unavailable
}

async function deliver(p: Payload): Promise<ShareResult> {
  if (prefersNativeShare()) {
    try {
      await navigator.share({ title: p.title, text: p.text, url: p.url });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // any other native failure: fall back to copying
    }
  }
  return (await copyText(p.clipboardText)) ? 'copied' : 'failed';
}

export function shareVerse(input: ShareInput): Promise<ShareResult> {
  const text = buildShareText(input);
  return deliver({ title: `${input.reference} \u2014 Daily Bible Verse`, text: text.replace(`\n${input.url}`, ''), url: input.url, clipboardText: text });
}

/** Shares the website itself: native share sheet where available, otherwise copies the link. */
export function shareWebsite(url: string): Promise<ShareResult> {
  return deliver({
    title: 'Daily Bible Verse \u2014 AlphaOmega Studio',
    text: 'A little Scripture, a little peace, every day.',
    url,
    clipboardText: url,
  });
}
