import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteVerse, listVerses, type ListQuery } from './api';
import { formatLongDate } from '../lib/dates';
import type { VerseSummary } from '../types';

const PAGE_SIZE = 15;

export function VersesPage() {
  const location = useLocation();
  const [query, setQuery] = useState<ListQuery>({ search: '', date: '', sort: 'date-desc', page: 1, pageSize: PAGE_SIZE });
  const [rows, setRows] = useState<VerseSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState((location.state as { notice?: string } | null)?.notice ?? '');
  const [pending, setPending] = useState<VerseSummary | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listVerses(query)
      .then((r) => {
        setRows(r.rows);
        setTotal(r.total);
        setError('');
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [query]);
  useEffect(load, [load]);

  const set = (patch: Partial<ListQuery>) => setQuery((q) => ({ ...q, page: 1, ...patch }));
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const confirmDelete = async () => {
    if (!pending) return;
    try {
      await deleteVerse(pending.id);
      setNotice(`Deleted ${pending.reference} (${pending.verse_date}).`);
      setPending(null);
      load();
    } catch (e) {
      setError((e as Error).message);
      setPending(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Verses</h1>
        <Link to="/admin/verses/new" className="btn btn-primary">Add verse</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="search" className="label">Search reference</label>
          <input id="search" className="field" value={query.search} onChange={(e) => set({ search: e.target.value })} placeholder="Luke" />
        </div>
        <div>
          <label htmlFor="fdate" className="label">Date</label>
          <input id="fdate" type="date" className="field" value={query.date} onChange={(e) => set({ date: e.target.value })} />
        </div>
        <div>
          <label htmlFor="sort" className="label">Sort by</label>
          <select id="sort" className="field" value={query.sort} onChange={(e) => set({ sort: e.target.value as ListQuery['sort'] })}>
            <option value="date-desc">Date, newest first</option>
            <option value="date-asc">Date, oldest first</option>
            <option value="reference">Reference, A to Z</option>
          </select>
        </div>
      </div>

      {notice && <p role="status" className="rounded-lg bg-brand-soft px-3 py-2 text-sm">{notice}</p>}
      {error && <p role="alert" className="text-danger">{error}</p>}
      {pending && (
        <div role="alertdialog" aria-labelledby="del-title" className="rounded-xl border border-danger bg-surface p-4">
          <p id="del-title" className="font-medium">Delete {pending.reference} scheduled for {formatLongDate(pending.verse_date)}?</p>
          <p className="mt-1 text-sm text-muted">Its translations are deleted too. This cannot be undone.</p>
          <div className="mt-3 flex gap-2">
            <button className="btn btn-danger" onClick={() => void confirmDelete()}>Delete verse</button>
            <button className="btn" onClick={() => setPending(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr><th scope="col" className="px-3 py-2">Date</th><th scope="col" className="px-3 py-2">Reference</th><th scope="col" className="px-3 py-2 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="px-3 py-6 text-muted">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={3} className="px-3 py-6 text-muted">No verses match. Change the filters or add a verse.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="whitespace-nowrap px-3 py-2">{r.verse_date}</td>
                  <td className="px-3 py-2 font-medium">{r.reference}</td>
                  <td className="whitespace-nowrap px-3 py-1 text-right">
                    <Link to={`/admin/verses/${r.id}`} className="btn mr-2" aria-label={`Edit ${r.reference} on ${r.verse_date}`}><Pencil size={16} aria-hidden /> Edit</Link>
                    <button className="btn btn-danger" aria-label={`Delete ${r.reference} on ${r.verse_date}`} onClick={() => setPending(r)}><Trash2 size={16} aria-hidden /> Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
        <span className="text-muted">{total} verse{total === 1 ? '' : 's'}, page {query.page} of {pages}</span>
        <div className="flex gap-2">
          <button className="btn" disabled={query.page <= 1} onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}>Previous</button>
          <button className="btn" disabled={query.page >= pages} onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}>Next</button>
        </div>
      </nav>
    </div>
  );
}
