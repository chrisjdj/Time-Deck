import es from './es.json';
import fr from './fr.json';
import de from './de.json';

/** English strings live inline as fallbacks: t('key', 'English text'). */
const DICTS: Record<string, Record<string, string>> = { es, fr, de };

export type TFn = (key: string, en: string, vars?: Record<string, string | number>) => string;

export function makeT(locale: string): TFn {
  const lang = locale.split('-')[0];
  const dict = DICTS[lang];
  return (key, en, vars) => {
    let s = dict?.[key] ?? en;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
}
