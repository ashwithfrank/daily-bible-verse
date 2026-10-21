import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStats, type Stats } from './api';
import { config } from '../lib/config';
import { formatLongDate, todayInTimezone } from '../lib/dates';
import type { VerseSummary } from '../types';

function List({ title, rows, empty }: { title: string; rows: VerseSummary[]; empty: string }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <h2 className="font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id}>
              <Link to={`/admin/verses/${r.id}`} className="flex flex-wrap justify-between gap-x-3 py-2 text-sm hover:text-brand">
                <span className="font-medium">{r.reference}</span>
                <span className="text-muted">{formatLongDate(r.verse_date)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetchStats(todayInTimezone(config.timezone)).then(setStats).catch((e: Error) => setError(e.message));
  }, []);
  if (error) return <p role="alert" className="text-danger">{error}</p>;
  if (!stats) return <p className="text-muted" role="status">Loading…</p>;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link to="/admin/verses/new" className="btn btn-primary">Add verse</Link>
      </div>
      <dl className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-line bg-surface p-4"><dt className="text-sm text-muted">Scheduled verses</dt><dd className="text-3xl font-bold">{stats.total}</dd></div>
        <div className="rounded-xl border border-line bg-surface p-4"><dt className="text-sm text-muted">This month</dt><dd className="text-3xl font-bold">{stats.thisMonth}</dd></div>
      </dl>
      <div className="grid gap-4 md:grid-cols-2">
        <List title="Upcoming" rows={stats.upcoming} empty="Nothing scheduled from today onward. Add a verse." />
        <List title="Recently edited" rows={stats.recent} empty="No verses yet." />
      </div>
    </div>
  );
}
