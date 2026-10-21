import { LANGUAGES } from '../lib/languages';
import type { Translation } from '../types';
import { translationLabel } from '../lib/translations';

interface Props {
  value: string;
  available: Set<string>;
  onChange: (code: string) => void;
  versions: Translation[];
  versionId: string;
  onVersionChange: (id: string) => void;
}

export function LanguageSelect({ value, available, onChange, versions, versionId, onVersionChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
      <label htmlFor="lang" className="sr-only">Language</label>
      <select
        id="lang"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[40px] rounded-lg border border-line bg-surface px-2 py-1 text-sm text-ink"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.native}
            {l.code !== 'en' && !available.has(l.code) ? ' (not yet available)' : ''}
          </option>
        ))}
      </select>
      {versions.length > 1 && (
        <>
          <label htmlFor="ver" className="sr-only">Translation version</label>
          <select id="ver" value={versionId} onChange={(e) => onVersionChange(e.target.value)} className="min-h-[40px] rounded-lg border border-line bg-surface px-2 py-1 text-sm text-ink">
            {versions.map((t) => (
              <option key={t.id} value={t.id}>{translationLabel(t)}</option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
