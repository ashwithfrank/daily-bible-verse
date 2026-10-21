import { useState } from 'react';
import { bulkInsert, existingDates } from './api';
import { buildImportPreview, markExisting, parseCsv, type ImportRow } from '../lib/csv';

export function ImportPage() {
  const [text, setText] = useState('');
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [headerError, setHeaderError] = useState('');
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (file) setText(await file.text());
  };

  const preview = async () => {
    setMessage(null);
    const built = buildImportPreview(parseCsv(text));
    setHeaderError(built.headerError ?? '');
    if (built.headerError) return setRows(null);
    setBusy(true);
    try {
      const existing = await existingDates(built.rows.filter((r) => r.status === 'ok').map((r) => r.date));
      setRows(markExisting(built.rows, existing));
    } catch (e) {
      setMessage({ kind: 'error', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const ready = rows?.filter((r) => r.status === 'ok') ?? [];
  const commit = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const n = await bulkInsert(ready);
      setMessage({ kind: 'ok', text: `Imported ${n} verse${n === 1 ? '' : 's'}.` });
      setRows(null);
      setText('');
    } catch (e) {
      setMessage({ kind: 'error', text: `Nothing was imported. ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Import verses from CSV</h1>
      <p className="text-sm text-muted">
        Columns: <code>date,reference,english_quote</code>. Dates are YYYY-MM-DD. Existing dates are skipped, never overwritten. Up to 500 rows. <a className="underline" href={`${import.meta.env.BASE_URL}sample-verses.csv`} download>Download a sample file</a>.
      </p>
      <div>
        <label htmlFor="csvfile" className="label">CSV file</label>
        <input id="csvfile" type="file" accept=".csv,text/csv" className="field" onChange={(e) => void onFile(e.target.files?.[0])} />
      </div>
      <div>
        <label htmlFor="csvtext" className="label">Or paste CSV text</label>
        <textarea id="csvtext" rows={6} className="field font-mono text-sm" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <button className="btn btn-primary" disabled={!text.trim() || busy} onClick={() => void preview()}>Preview import</button>
      {headerError && <p role="alert" className="text-danger">{headerError}</p>}
      {message && <p role={message.kind === 'error' ? 'alert' : 'status'} className={message.kind === 'error' ? 'text-danger' : 'rounded-lg bg-brand-soft px-3 py-2 text-sm'}>{message.text}</p>}
      {rows && (
        <>
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-muted"><tr><th className="px-3 py-2">Line</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Reference</th><th className="px-3 py-2">Result</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.line} className="border-b border-line last:border-0">
                    <td className="px-3 py-2">{r.line}</td>
                    <td className="whitespace-nowrap px-3 py-2">{r.date}</td>
                    <td className="px-3 py-2">{r.reference}</td>
                    <td className={`px-3 py-2 ${r.status === 'ok' ? '' : 'text-danger'}`}>{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted">{ready.length} of {rows.length} rows will be imported. All rows are saved together or not at all.</p>
          <button className="btn btn-primary" disabled={!ready.length || busy} onClick={() => void commit()}>Import {ready.length} verse{ready.length === 1 ? '' : 's'}</button>
        </>
      )}
    </div>
  );
}
