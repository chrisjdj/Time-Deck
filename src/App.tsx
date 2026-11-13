import { useEffect, useMemo } from 'react';
import { Dashboard } from './dashboard/Dashboard';
import { DisplayPage } from './display/DisplayPage';
import { AlertOverlay, Engine, FlashBanner } from './components/Engine';
import { useApplyTheme, useHashRoute } from './hooks/misc';
import { parseDisplayParams } from './lib/share';
import { isIsolated } from './store/deck';
import { sync } from './lib/sync';
import { preloadModes } from './modes';
import { useLocale } from './i18n';

export default function App() {
  useApplyTheme();
  const locale = useLocale();
  const { path, query } = useHashRoute();
  const isDisplay = path === '/display';
  const params = useMemo(() => parseDisplayParams(query), [query]);

  // Share/embed links run isolated (set up in main.tsx before first render).
  const standalone = isDisplay && isIsolated();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    sync.setRole(isDisplay ? 'display' : 'dashboard');
    if (!isDisplay || standalone) return;
    return sync.startHeartbeat();
  }, [isDisplay, standalone]);

  useEffect(() => {
    const h = window.setTimeout(preloadModes, 1500);
    return () => clearTimeout(h);
  }, []);

  return (
    <>
      <Engine />
      {isDisplay ? <DisplayPage params={params} standalone={standalone} /> : <Dashboard />}
      <FlashBanner />
      {!params.embed && <AlertOverlay />}
    </>
  );
}
