import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Keyboard, Maximize, Minimize, Moon, Sun } from 'lucide-react';
import { useDeck } from '../store/deck';
import { DeckView } from '../components/DeckView';
import { ControlBar } from '../components/ControlBar';
import { HelpOverlay } from '../components/HelpOverlay';
import { useFullscreen, useIdle, useResolvedTheme } from '../hooks/misc';
import { useHotkeys } from '../hooks/useHotkeys';
import { keepAwake, toggleFullscreen } from '../lib/browser';
import { MODES, MODE_MAP } from '../modes';
import { useT } from '../i18n';
import type { DisplayParams } from '../lib/share';

export function DisplayPage({ params, standalone }: { params: DisplayParams; standalone: boolean }) {
  const t = useT();
  const config = useDeck((s) => s.config);
  const patch = useDeck((s) => s.patch);
  const update = useDeck((s) => s.update);
  const setMode = useDeck((s) => s.setMode);
  const fs = useFullscreen();
  const [help, setHelp] = useState(false);
  const embed = params.embed;
  const touch = config.appearance.touchMode;
  const idle = useIdle(3000, !embed && !touch);
  const isPopup = !!window.opener || window.name === 'time-deck-display';

  useEffect(() => {
    if (embed) return;
    keepAwake(true);
    return () => keepAwake(false);
  }, [embed]);

  useEffect(() => {
    document.body.classList.toggle('is-embed', embed);
    document.body.classList.toggle('is-transparent', params.transparent);
    return () => document.body.classList.remove('is-embed', 'is-transparent');
  }, [embed, params.transparent]);

  const exit = useCallback(() => {
    if (document.fullscreenElement) return; // browser handles Esc for fullscreen
    if (embed) return;
    if (isPopup && !standalone) window.close();
    else location.hash = '#/';
  }, [embed, isPopup, standalone]);

  useHotkeys({ onEscape: exit, onHelp: () => setHelp(true) });

  // Swipe between modes in touch mode.
  const start = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (touch && e.pointerType !== 'mouse') start.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2) {
      const i = MODES.findIndex((m) => m.id === config.mode);
      const next = MODES[(i + (dx < 0 ? 1 : -1) + MODES.length) % MODES.length];
      setMode(next.id);
    }
  };

  const theme = useResolvedTheme();

  return (
    <div className={'display' + (idle ? ' is-idle' : '') + (touch ? ' is-touch' : '')} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <DeckView config={config} params={params} />
      {!embed && (
        <>
          <div className="display__top">
            {!(isPopup && !standalone) && (
              <a
                className="d-chip"
                // A share link runs isolated from saved settings: reload into the real dashboard.
                href={standalone ? location.pathname + location.search : '#/'}
                title={t('d.back', 'Back to dashboard')}
              >
                <ArrowLeft size={18} /> <span>{t('d.dashboard', 'Dashboard')}</span>
              </a>
            )}
            <div className="display__spacer" />
            {MODE_MAP[config.mode]?.showsTime && (
              <button
                type="button"
                className="d-chip d-chip--text"
                onClick={() => update((c) => void (c.appearance.hour12 = !c.appearance.hour12))}
                aria-label={t('k.hour', 'Switch 12h (AM/PM) / 24h')}
                title={t('k.hour', 'Switch 12h (AM/PM) / 24h')}
              >
                {config.appearance.hour12 ? t('hf.12s', '12h') : t('hf.24', '24h')}
              </button>
            )}
            <button type="button" className="d-chip" onClick={() => patch({ themePref: theme === 'dark' ? 'light' : 'dark' })} aria-label={t('k.theme', 'Toggle light / dark')}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button type="button" className="d-chip hide-sm" onClick={() => setHelp(true)} aria-label={t('k.title', 'Keyboard shortcuts')}>
              <Keyboard size={18} />
            </button>
            <button type="button" className="d-chip" onClick={() => void toggleFullscreen()} aria-label={t('k.fullscreen', 'Toggle full screen')}>
              {fs ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
          <div className="display__bottom">
            <ControlBar config={config} variant="display" />
          </div>
        </>
      )}
      {help && <HelpOverlay onClose={() => setHelp(false)} />}
    </div>
  );
}
