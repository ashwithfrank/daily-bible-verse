import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { DatePicker } from '../components/DatePicker';
import { LanguageSelect } from '../components/LanguageSelect';
import { LikeButton } from '../components/LikeButton';
import { ShareButton } from '../components/ShareButton';
import { config, getConfigError } from '../lib/config';
import { isValidIsoDate, todayInTimezone, formatLongDate } from '../lib/dates';
import { DEFAULT_LANGUAGE, findLanguage } from '../lib/languages';
import { getVerseByDate } from '../lib/verses';
import { languagesWithTranslations, translationLabel, translationsFor } from '../lib/translations';
import { stripOuterQuotes } from '../lib/share';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import type { Verse } from '../types';

type State = { status: 'loading' } | { status: 'ready'; verse: Verse } | { status: 'empty' } | { status: 'error'; message: string };

export function HomePage() {
  const params = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const today = todayInTimezone(config.timezone);
  const requested = params.date;
  const dateValid = !requested || isValidIsoDate(requested);
  const date = requested && dateValid ? requested : today;

  const langParam = search.get('lang') ?? DEFAULT_LANGUAGE;
  const lang = findLanguage(langParam) ? langParam : DEFAULT_LANGUAGE;

  const [state, setState] = useState<State>({ status: 'loading' });
  const [versionId, setVersionId] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!dateValid) return;
    const problem = getConfigError();
    if (problem) {
      setState({ status: 'error', message: problem });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    getVerseByDate(date)
      .then((verse) => !cancelled && setState(verse ? { status: 'ready', verse } : { status: 'empty' }))
      .catch(() => !cancelled && setState({ status: 'error', message: 'The verse could not be loaded. Check your connection and try again.' }));
    return () => {
      cancelled = true;
    };
  }, [date, dateValid, attempt]);

  const verse = state.status === 'ready' ? state.verse : null;
  const versions = useMemo(() => (verse && lang !== 'en' ? translationsFor(verse, lang) : []), [verse, lang]);
  const translation = versions.find((t) => t.id === versionId) ?? versions[0];
  useEffect(() => setVersionId(''), [date, lang]);

  const quote = translation ? translation.quote : verse?.english_quote ?? '';
  const label = translation ? translationLabel(translation) : undefined;
  const shareUrl = `${config.siteUrl}/${date}${lang !== 'en' ? `?lang=${lang}` : ''}`;

  useDocumentMeta({
    title: verse ? `${verse.reference} — Daily Bible Verse | AlphaOmega Studio` : 'Daily Bible Verse — AlphaOmega Studio',
    description: verse ? `${verse.reference}: ${stripOuterQuotes(verse.english_quote)}`.slice(0, 200) : 'Read one Bible verse each day. Pick any date, like it and share it.',
    canonical: `${config.siteUrl}/${requested && dateValid ? requested : ''}`,
  });

  const goTo = (iso: string) => navigate({ pathname: `/${iso}`, search: lang !== 'en' ? `?lang=${lang}` : '' });
  const setLang = (code: string) => {
    const next = new URLSearchParams(search);
    if (code === 'en') next.delete('lang');
    else next.set('lang', code);
    setSearch(next, { replace: true });
  };

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-2 sm:px-6">
        <h1 className="sr-only">Daily Bible Verse</h1>
        <section aria-labelledby="verse-ref" className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-10">
          {!dateValid ? (
            <Message title="That date is not valid">
              <Link className="underline" to="/">Go to today&apos;s verse</Link>
            </Message>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <h2 id="verse-ref" className="text-base font-semibold text-brand">
                  {verse ? verse.reference : formatLongDate(date)}
                </h2>
                <DatePicker date={date} onChange={goTo} />
              </div>

              {state.status === 'loading' && <p className="mt-8 text-muted" role="status">Loading verse…</p>}

              {state.status === 'error' && (
                <div className="mt-8" role="alert">
                  <p className="text-ink">{state.message}</p>
                  {!getConfigError() && <button className="btn mt-4" onClick={() => setAttempt((n) => n + 1)}>Try again</button>}
                </div>
              )}

              {state.status === 'empty' && (
                <p className="mt-8 text-lg text-ink">No verse has been scheduled for this date yet. Please choose another date.</p>
              )}

              {verse && (
                <>
                  <blockquote lang={translation ? lang : 'en'} className="mt-6 border-l-4 border-sage pl-4 font-serif text-[1.65rem] leading-[1.45] text-ink sm:pl-6 sm:text-4xl sm:leading-[1.4]">
                    <p>{`\u201C${stripOuterQuotes(quote)}\u201D`}</p>
                  </blockquote>
                  {label && <p className="mt-3 text-sm text-muted">{label}</p>}
                  {lang !== 'en' && !translation && (
                    <p className="mt-3 text-sm text-muted" role="status">
                      No reviewed {findLanguage(lang)?.name} translation is available for this date yet. The English original is shown.
                    </p>
                  )}

                  <div className="mt-6">
                    <LanguageSelect
                      value={lang}
                      available={languagesWithTranslations(verse)}
                      onChange={setLang}
                      versions={versions}
                      versionId={translation?.id ?? ''}
                      onVersionChange={setVersionId}
                    />
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
                    <LikeButton verseDate={verse.verse_date} />
                    <ShareButton input={{ reference: verse.reference, quote, dateIso: verse.verse_date, url: shareUrl, translationLabel: label }} />
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}

function Message({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div role="alert">
      <p className="text-lg text-ink">{title}</p>
      <p className="mt-3 text-muted">{children}</p>
    </div>
  );
}

