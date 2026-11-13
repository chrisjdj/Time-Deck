import { useEffect, useState } from 'react';
import { useDeck } from '../store/deck';

/** True after `ms` without pointer/keyboard activity. */
export function useIdle(ms = 3000, enabled = true): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let t = 0;
    const wake = () => {
      setIdle(false);
      clearTimeout(t);
      t = window.setTimeout(() => setIdle(true), ms);
    };
    wake();
    const evs = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    evs.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    return () => {
      clearTimeout(t);
      evs.forEach((e) => window.removeEventListener(e, wake));
    };
  }, [ms, enabled]);
  return enabled && idle;
}

export function useMediaQuery(q: string): boolean {
  const [m, setM] = useState(() => (typeof matchMedia !== 'undefined' ? matchMedia(q).matches : false));
  useEffect(() => {
    const mq = matchMedia(q);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return m;
}

/** The effective theme (preference resolved against the OS setting). Safe to use during render. */
export function useResolvedTheme(): 'light' | 'dark' {
  const pref = useDeck((s) => s.themePref);
  const sysDark = useMediaQuery('(prefers-color-scheme: dark)');
  return pref === 'system' ? (sysDark ? 'dark' : 'light') : pref;
}

/** Resolves the theme preference and applies data-theme to <html>. */
export function useApplyTheme(): 'light' | 'dark' {
  const theme = useResolvedTheme();
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* ignore */
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', theme === 'dark' ? '#0b0d14' : '#f6f7fb');
  }, [theme]);
  return theme;
}

export function useFullscreen(): boolean {
  const [fs, setFs] = useState(() => !!document.fullscreenElement);
  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  return fs;
}

/** Container-agnostic hash route. */
export function useHashRoute(): { path: string; query: string } {
  const read = () => {
    const h = location.hash.replace(/^#/, '') || '/';
    const [path, query = ''] = h.split('?');
    return { path: path || '/', query };
  };
  const [r, setR] = useState(read);
  useEffect(() => {
    const on = () => setR(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return r;
}
