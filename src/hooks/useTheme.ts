import { useCallback, useEffect, useState } from 'react';
import { applyTheme, chooseTheme, currentTheme, storedTheme, systemTheme, type Theme } from '../lib/theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  // Make sure the document reflects the resolved theme (the inline script in index.html normally did this already).
  useEffect(() => applyTheme(theme), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Until the visitor makes an explicit choice, follow the operating system if it changes.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (!mq) return;
    const onChange = () => {
      if (storedTheme()) return;
      const next = systemTheme();
      applyTheme(next);
      setTheme(next);
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    chooseTheme(next);
    setTheme(next);
  }, [theme]);

  return { theme, toggle };
}
