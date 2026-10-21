import { useRef } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, formatLongDate, isValidIsoDate } from '../lib/dates';

interface Props {
  date: string;
  onChange: (iso: string) => void;
}

export function DatePicker({ date, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const open = () => {
    try {
      ref.current?.showPicker?.();
    } catch {
      /* browsers without showPicker still open from the native tap */
    }
  };
  return (
    <div className="flex items-center gap-1 text-muted">
      <button type="button" className="rounded-md p-2 hover:bg-brand-soft" aria-label="Previous day" onClick={() => onChange(addDays(date, -1))}>
        <ChevronLeft size={18} aria-hidden />
      </button>
      <label className="relative flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-brand-soft focus-within:outline focus-within:outline-2 focus-within:outline-brand">
        <CalendarDays size={16} aria-hidden />
        <time dateTime={date}>{formatLongDate(date)}</time>
        <input
          ref={ref}
          type="date"
          value={date}
          aria-label="Choose a date"
          onClick={open}
          onChange={(e) => isValidIsoDate(e.target.value) && onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      <button type="button" className="rounded-md p-2 hover:bg-brand-soft" aria-label="Next day" onClick={() => onChange(addDays(date, 1))}>
        <ChevronRight size={18} aria-hidden />
      </button>
    </div>
  );
}
