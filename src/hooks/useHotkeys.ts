import { useEffect } from 'react';
import { actions } from '../store/actions';
import { useDeck } from '../store/deck';
import { toggleFullscreen } from '../lib/browser';

export interface HotkeyExtras {
  onEscape?: () => void;
  onHelp?: () => void;
}

function typing(el: EventTarget | null): boolean {
  const e = el as HTMLElement | null;
  if (!e) return false;
  const tag = e.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.isContentEditable;
}

export function useHotkeys(extras: HotkeyExtras = {}) {
  const { onEscape, onHelp } = extras;
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (typing(e.target)) return;
      // Let buttons handle Space/Enter themselves when focused.
      const onButton = (e.target as HTMLElement | null)?.tagName === 'BUTTON';
      const mode = useDeck.getState().config.mode;
      const stepped = mode === 'presenter' || mode === 'intervals';
      switch (e.key) {
        case ' ':
          if (onButton) return;
          e.preventDefault();
          actions.toggle();
          break;
        case 'l':
        case 'L':
          actions.lap();
          break;
        case 'r':
        case 'R':
          actions.reset();
          break;
        case 'f':
        case 'F':
          void toggleFullscreen();
          break;
        case 't':
        case 'T': {
          const cur = document.documentElement.getAttribute('data-theme');
          useDeck.getState().patch({ themePref: cur === 'dark' ? 'light' : 'dark' });
          break;
        }
        case 'h':
        case 'H':
          useDeck.getState().update((c) => void (c.appearance.hour12 = !c.appearance.hour12));
          break;
        case 'ArrowUp':
          e.preventDefault();
          actions.adjust(1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          actions.adjust(-1);
          break;
        case 'n':
        case 'N':
          actions.next();
          break;
        case 'p':
        case 'P':
          actions.prev();
          break;
        case 'PageDown':
        case 'ArrowRight':
          if (e.key === 'ArrowRight' && !stepped) return;
          e.preventDefault();
          if (stepped) actions.next();
          else actions.toggle();
          break;
        case 'PageUp':
        case 'ArrowLeft':
          if (e.key === 'ArrowLeft' && !stepped) return;
          e.preventDefault();
          if (stepped) actions.prev();
          else actions.toggle();
          break;
        case 'Escape':
          onEscape?.();
          break;
        case '?':
          onHelp?.();
          break;
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [onEscape, onHelp]);
}
