import { createContext, useContext } from 'react';
import type { Appearance } from '../types';

export interface DeckCtxValue {
  appearance: Appearance;
  preview: boolean;
  embed: boolean;
}

export const DeckCtx = createContext<DeckCtxValue | null>(null);

export function useDeckCtx(): DeckCtxValue {
  const v = useContext(DeckCtx);
  if (!v) throw new Error('DeckCtx missing');
  return v;
}
