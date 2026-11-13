import { useCallback } from 'react';
import { useDeck } from '../store/deck';
import type { DeckConfig, ModeSettings } from '../types';

export interface DisplayProps {
  config: DeckConfig;
}

export function useModeSettings<K extends keyof ModeSettings>(k: K): [ModeSettings[K], (fn: (d: ModeSettings[K]) => void) => void] {
  const s = useDeck((st) => st.config.settings[k]);
  const update = useDeck((st) => st.update);
  const set = useCallback((fn: (d: ModeSettings[K]) => void) => update((c) => fn(c.settings[k])), [update, k]);
  return [s, set];
}

/** Columns/rows for N tiles, favouring landscape screens. */
export function gridFor(n: number): { cols: number; rows: number } {
  if (n <= 1) return { cols: 1, rows: 1 };
  if (n === 2) return { cols: 2, rows: 1 };
  if (n === 3) return { cols: 3, rows: 1 };
  if (n === 4) return { cols: 2, rows: 2 };
  if (n <= 6) return { cols: 3, rows: 2 };
  if (n <= 8) return { cols: 4, rows: 2 };
  if (n === 9) return { cols: 3, rows: 3 };
  return { cols: 4, rows: Math.ceil(n / 4) };
}
