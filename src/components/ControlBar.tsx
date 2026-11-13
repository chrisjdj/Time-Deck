import { Flag, Minus, Pause, Play, Plus, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { useRef } from 'react';
import type { DeckConfig } from '../types';
import { actions, hasTimer, mainKey } from '../store/actions';
import { useT } from '../i18n';

/** Start/pause/reset/lap/±1 min/prev/next for the current mode. */
export function ControlBar({ config, variant = 'dashboard' }: { config: DeckConfig; variant?: 'dashboard' | 'display' }) {
  const t = useT();
  const touch = config.appearance.touchMode && variant === 'display';
  const holdTimer = useRef<number | undefined>(undefined);
  if (!hasTimer(config)) return null;
  const mode = config.mode;
  const k = mainKey(mode);
  const running =
    mode === 'multi' ? config.settings.multi.timers.some((x) => x.run.status === 'running') : k ? config.runtime[k].status === 'running' : false;
  const idle = mode === 'multi' ? config.settings.multi.timers.every((x) => x.run.status === 'idle') : k ? config.runtime[k].status === 'idle' : true;
  const canAdjust = mode === 'countdown' || mode === 'presenter' || mode === 'exam' || mode === 'intervals';
  const canStep = mode === 'presenter' || mode === 'intervals';
  const size = touch ? 22 : 18;

  // In touch mode reset needs a long-press to avoid accidental taps.
  const resetProps = touch
    ? {
        onPointerDown: () => {
          holdTimer.current = window.setTimeout(() => actions.reset(), 700);
        },
        onPointerUp: () => clearTimeout(holdTimer.current),
        onPointerLeave: () => clearTimeout(holdTimer.current),
        title: t('cb.holdReset', 'Hold to reset'),
      }
    : { onClick: () => actions.reset(), title: t('a.reset', 'Reset') + ' (R)' };

  return (
    <div className={`controlbar controlbar--${variant}` + (touch ? ' controlbar--touch' : '')} role="toolbar" aria-label={t('cb.controls', 'Timer controls')}>
      {canStep && (
        <button type="button" className="cb-btn" onClick={actions.prev} aria-label={t('a.prev', 'Previous')} title={t('a.prev', 'Previous') + ' (P)'}>
          <SkipBack size={size} />
        </button>
      )}
      {canAdjust && (
        <button type="button" className="cb-btn" onClick={() => actions.adjust(-1)} aria-label={t('a.minus1', 'Minus 1 minute')} title={t('a.minus1', 'Minus 1 minute') + ' (↓)'}>
          <Minus size={size} />
          <span className="cb-btn__txt">1m</span>
        </button>
      )}
      <button type="button" className="cb-btn" disabled={idle} aria-label={touch ? t('cb.holdReset', 'Hold to reset') : t('a.reset', 'Reset')} {...resetProps}>
        <RotateCcw size={size} />
      </button>
      <button
        type="button"
        className={'cb-btn cb-btn--primary' + (running ? ' is-running' : '')}
        onClick={actions.toggle}
        aria-label={running ? t('a.pause', 'Pause') : t('a.start', 'Start')}
        title={(running ? t('a.pause', 'Pause') : t('a.start', 'Start')) + ' (Space)'}
      >
        {running ? <Pause size={size + 4} /> : <Play size={size + 4} />}
        <span className="cb-btn__label">{running ? t('a.pause', 'Pause') : idle ? t('a.start', 'Start') : t('a.resume', 'Resume')}</span>
      </button>
      {mode === 'stopwatch' && (
        <button type="button" className="cb-btn" onClick={actions.lap} disabled={!running} aria-label={t('sw.lap', 'Lap')} title={t('sw.lap', 'Lap') + ' (L)'}>
          <Flag size={size} />
        </button>
      )}
      {canAdjust && (
        <button type="button" className="cb-btn" onClick={() => actions.adjust(1)} aria-label={t('a.plus1', 'Plus 1 minute')} title={t('a.plus1', 'Plus 1 minute') + ' (↑)'}>
          <Plus size={size} />
          <span className="cb-btn__txt">1m</span>
        </button>
      )}
      {canStep && (
        <button type="button" className="cb-btn" onClick={actions.next} aria-label={t('a.next', 'Next')} title={t('a.next', 'Next') + ' (N)'}>
          <SkipForward size={size} />
        </button>
      )}
    </div>
  );
}
