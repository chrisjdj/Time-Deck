import { create } from 'zustand';
import type { Signal } from '../lib/signals';

/** Per-window transient banner + live-region text for timer events. */
interface FlashState {
  text: string;
  kind: Signal['kind'] | '';
  at: number;
  show: (text: string, kind: Signal['kind']) => void;
}

export const useFlash = create<FlashState>((set) => ({
  text: '',
  kind: '',
  at: 0,
  show: (text, kind) => set({ text, kind, at: Date.now() }),
}));
