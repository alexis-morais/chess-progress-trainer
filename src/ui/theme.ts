import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
export const THEME_KEY = 'chess-progress:theme:v1';
export function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}
export function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#14201e' : '#f6f7f2');
}
export function useTheme() {
  const [preference, setPreference] = useState<Theme | null>(savedTheme);
  const [system, setSystem] = useState<Theme>(systemTheme);
  const theme = preference ?? system;
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const change = () => setSystem(systemTheme());
    const storage = (event: StorageEvent) => {
      if (event.key === THEME_KEY || event.key === null) setPreference(savedTheme());
    };
    media?.addEventListener('change', change);
    window.addEventListener('storage', storage);
    return () => {
      media?.removeEventListener('change', change);
      window.removeEventListener('storage', storage);
    };
  }, []);
  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setPreference(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* The choice still applies to this session. */
    }
  }
  return { theme, toggle };
}
