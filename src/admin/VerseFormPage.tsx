import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { getVerseById, saveVerse } from './api';
import { validateVerseInput, type Errors } from '../lib/validation';
import { LANGUAGES, findLanguage } from '../lib/languages';
import { addDays, todayInTimezone } from '../lib/dates';
import { config } from '../lib/config';
import type { TranslationInput, VerseInput } from '../types';

const emptyTranslation = (): TranslationInput => ({ language_code: 'kn', language_name: 'Kannada', translation_name: '', quote: '', source_url: '', approved: true });
const blank = (date: string): VerseInput => ({ verse_date: date, reference: '', english_quote: '', notes: '', translations: [] });

export function VerseFormPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const [form, setForm] = useState<VerseInput>(() => blank(search.get('date') ?? todayInTimezone(config.timezone)));
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    getVerseById(id!)
      .then(setForm)
      .catch((e: Error) => setMessage({ kind: 'error', text: e.message }))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const patch = (p: Partial<VerseInput>) => setForm((f) => ({ ...f, ...p }));
  const patchT = (i: number, p: Partial<TranslationInput>) => setForm((f) => ({ ...f, translations: f.translations.map((t, n) => (n === i ? { ...t, ...p } : t)) }));

  const submit = async (addAnother: boolean) => {
    const found = validateVerseInput(form);
    setErrors(found);
    if (Object.keys(found).length) {
      setMessage({ kind: 'error', text: 'Fix the highlighted fields and save again.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const savedId = await saveVerse(form);
      if (addAnother) {
        setForm(blank(addDays(form.verse_date, 1)));
        setMessage({ kind: 'ok', text: `Saved ${form.reference.trim()}. Add the next verse.` });
        window.scrollTo?.({ top: 0 });
      } else {
        navigate('/admin/verses', { state: { notice: `Saved ${form.reference.trim()} for ${form.verse_date}.` } });
      }
      void savedId;
    } catch (e) {
      setMessage({ kind: 'error', text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted" role="status">Loading…</p>;

  const err = (k: string) => errors[k] && <p id={`${k}-err`} className="error-text">{errors[k]}</p>;
  const aria = (k: string) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${k}-err` : undefined });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit(false);
      }}
      className="space-y-5"
    >
      <h1 className="text-2xl font-bold">{isNew ? 'Add a daily verse' : 'Edit verse'}</h1>
      {message && <p role={message.kind === 'error' ? 'alert' : 'status'} className={`rounded-lg px-3 py-2 text-sm ${message.kind === 'error' ? 'bg-danger/10 text-danger' : 'bg-brand-soft'}`}>{message.text}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="verse_date" className="label">Date</label>
          <input id="verse_date" type="date" className="field" value={form.verse_date} onChange={(e) => patch({ verse_date: e.target.value })} {...aria('verse_date')} />
          {err('verse_date')}
        </div>
        <div>
          <label htmlFor="reference" className="label">Bible reference</label>
          <input id="reference" className="field" placeholder="Luke 12:40" value={form.reference} onChange={(e) => patch({ reference: e.target.value })} {...aria('reference')} />
          {err('reference')}
        </div>
      </div>
      <div>
        <label htmlFor="english_quote" className="label">Original English quotation</label>
        <textarea id="english_quote" rows={4} className="field" value={form.english_quote} onChange={(e) => patch({ english_quote: e.target.value })} {...aria('english_quote')} />
        {err('english_quote')}
      </div>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Translations</legend>
        <p className="text-sm text-muted">Only add text from a translation you are licensed to use and have reviewed. Leave a language out if you do not have one.</p>
        {form.translations.map((t, i) => (
          <div key={t.id ?? i} className="space-y-3 rounded-xl border border-line bg-surface p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={`t${i}-lang`} className="label">Translation language</label>
                <select id={`t${i}-lang`} className="field" value={t.language_code} onChange={(e) => patchT(i, { language_code: e.target.value, language_name: findLanguage(e.target.value)?.name ?? e.target.value })} {...aria(`t.${i}.language_code`)}>
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
                {err(`t.${i}.language_code`)}
              </div>
              <div>
                <label htmlFor={`t${i}-name`} className="label">Version or source label</label>
                <input id={`t${i}-name`} className="field" placeholder="e.g. Indian Revised Version" value={t.translation_name} onChange={(e) => patchT(i, { translation_name: e.target.value })} />
              </div>
            </div>
            <div>
              <label htmlFor={`t${i}-quote`} className="label">Translation quotation</label>
              <textarea id={`t${i}-quote`} rows={3} className="field" value={t.quote} onChange={(e) => patchT(i, { quote: e.target.value })} {...aria(`t.${i}.quote`)} />
              {err(`t.${i}.quote`)}
            </div>
            <div>
              <label htmlFor={`t${i}-url`} className="label">Source link (optional)</label>
              <input id={`t${i}-url`} className="field" value={t.source_url} onChange={(e) => patchT(i, { source_url: e.target.value })} {...aria(`t.${i}.source_url`)} />
              {err(`t.${i}.source_url`)}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={t.approved} onChange={(e) => patchT(i, { approved: e.target.checked })} /> Reviewed and visible to readers</label>
              <button type="button" className="btn btn-danger" onClick={() => setForm((f) => ({ ...f, translations: f.translations.filter((_, n) => n !== i) }))}><Trash2 size={16} aria-hidden /> Remove translation</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn" onClick={() => setForm((f) => ({ ...f, translations: [...f.translations, emptyTranslation()] }))}><Plus size={16} aria-hidden /> Add translation</button>
      </fieldset>

      <div>
        <label htmlFor="notes" className="label">Internal notes (never shown to readers)</label>
        <textarea id="notes" rows={2} className="field" value={form.notes} onChange={(e) => patch({ notes: e.target.value })} {...aria('notes')} />
        {err('notes')}
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        {isNew && <button type="button" className="btn" disabled={saving} onClick={() => void submit(true)}>Save and add another</button>}
        <button type="button" className="btn" onClick={() => navigate('/admin/verses')}>Cancel</button>
      </div>
    </form>
  );
}
