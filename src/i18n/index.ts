import { useDeck } from '../store/deck';
import { makeT, type TFn } from './makeT';

export { makeT, type TFn };

export const UI_LANGS: Array<{ code: string; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
];

export function resolveLocale(pref: string): string {
  if (pref) return pref;
  try {
    return navigator.language || 'en';
  } catch {
    return 'en';
  }
}

const cache = new Map<string, TFn>();
function cachedT(locale: string): TFn {
  let t = cache.get(locale);
  if (!t) {
    t = makeT(locale);
    cache.set(locale, t);
  }
  return t;
}

export function useLocale(): string {
  return resolveLocale(useDeck((s) => s.locale));
}

export function useT(): TFn {
  return cachedT(useLocale());
}

/** Non-hook access (event engine, notifications). */
export function currentT(): TFn {
  return cachedT(resolveLocale(useDeck.getState().locale));
}

export function currentLocale(): string {
  return resolveLocale(useDeck.getState().locale);
}
