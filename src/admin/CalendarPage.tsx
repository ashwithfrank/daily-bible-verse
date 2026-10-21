import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { versesInRange } from './api';
import { config } from '../lib/config';
import { daysInMonth, todayInTimezone } from '../lib/dates';

const pad = (n: number) => String(n).padStart(2, '0');

export function CalendarPage() {
  const navigate = useNavigate();
  const today = todayInTimezone(config.timezone);
  const [cursor, setCursor] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) }));
  const [map, setMap] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState('');

  useEffect(() => {
    const start = `${cursor.y}-${pad(cursor.m)}-01`;
    const end = cursor.m === 12 ? `${cursor.y + 1}-01-01` : `${cursor.y}-${pad(cursor.m + 1)}-01`;
    setError('');
    versesInRange(start, end).then(setMap).catch((e: Error) => setError(e.message));
  }, [cursor]);

  const cells = useMemo(() => {
    const lead = new Date(Date.UTC(cursor.y, cursor.m - 1, 1)).getUTCDay();
    const total = daysInMonth(cursor.y, cursor.m);
    return [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)] as (number | null)[];
  }, [cursor]);

  const shift = (d: number) => setCursor(({ y, m }) => { const n = m - 1 + d; return { y: y + Math.floor(n / 12), m: ((n % 12) + 12) % 12 + 1 }; });
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(cursor.y, cursor.m - 1, 1)));

  const open = (day: number) => {
    const iso = `${cursor.y}-${pad(cursor.m)}-${pad(day)}`;
    const id = map.get(iso);
    navigate(id ? `/admin/verses/${id}` : `/admin/verses/new?date=${iso}`);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Calendar</h1>
      <div className="flex items-center justify-between">
        <button className="btn" aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft size={18} aria-hidden /></button>
        <h2 className="text-lg font-semibold" aria-live="polite">{monthName}</h2>
        <button className="btn" aria-label="Next month" onClick={() => shift(1)}><ChevronRight size={18} aria-hidden /></button>
      </div>
      {error && <p role="alert" className="text-danger">{error}</p>}
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted" aria-hidden>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} />;
          const iso = `${cursor.y}-${pad(cursor.m)}-${pad(day)}`;
          const has = map.has(iso);
          const isToday = iso === today;
          return (
            <button
              key={iso}
              onClick={() => open(day)}
              aria-label={`${iso}, ${has ? 'verse scheduled, open to edit' : 'no verse, open to add'}${isToday ? ', today' : ''}`}
              className={`flex min-h-[48px] flex-col items-center justify-center rounded-lg border text-sm ${has ? 'border-brand bg-brand text-on-brand' : 'border-line bg-surface text-ink hover:bg-brand-soft'} ${isToday ? 'ring-2 ring-offset-2 ring-brand ring-offset-paper' : ''}`}
            >
              {day}
              <span aria-hidden className="text-[10px] leading-none">{has ? '●' : '+'}</span>
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted">Filled days have a verse. Days marked + are empty. The ringed day is today in {config.timezone}.</p>
    </div>
  );
}
