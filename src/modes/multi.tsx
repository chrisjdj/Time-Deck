import { Pause, Play, Plus, RotateCcw, X } from 'lucide-react';
import type { CSSProperties } from 'react';
import { ProgressBar } from '../components/display';
import { DurationInput, Section, Select } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { useT } from '../i18n';
import { elapsed, formatCountdown, formatStopwatch, idleRun, MIN, uid } from '../lib/time';
import { actions } from '../store/actions';
import type { MultiTimer } from '../types';
import { gridFor, useModeSettings, type DisplayProps } from './common';

const COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#eab308', '#6366f1', '#f97316', '#22c55e', '#06b6d4'];

export function Display({ config }: DisplayProps) {
  const timers = config.settings.multi.timers;
  const t = useT();
  const anyRunning = timers.some((x) => x.run.status === 'running');
  const now = useNow(anyRunning ? 'fast' : 'second');
  const { cols, rows } = gridFor(timers.length);
  if (!timers.length) return <div className="d-empty">{t('mt.empty', 'Add timers in the settings panel')}</div>;
  return (
    <div className="m-multi" style={{ '--cols': cols, '--rows': rows } as CSSProperties}>
      {timers.map((tm) => {
        const e = elapsed(tm.run, now);
        const isCd = tm.kind === 'countdown';
        const rem = tm.durationMs - e;
        const done = isCd && rem <= 0 && tm.run.status === 'running';
        const text = isCd ? (rem <= 0 ? (tm.run.status === 'idle' ? formatCountdown(tm.durationMs) : '+' + formatCountdown(-rem)) : formatCountdown(rem)) : formatStopwatch(e, false);
        return (
          <div key={tm.id} className={'mtile' + (done ? ' is-done' : '') + (tm.run.status === 'running' ? ' is-running' : '')} style={{ '--tile': tm.color } as CSSProperties}>
            <button type="button" className="mtile__main" onClick={() => actions.multiToggle(tm.id)} aria-label={`${tm.label}: ${tm.run.status === 'running' ? t('a.pause', 'Pause') : t('a.start', 'Start')}`}>
              <span className="mtile__label">{tm.label}</span>
              <span className="mtile__time" role="timer">
                {text}
              </span>
              <span className="mtile__state">
                {done ? t('mt.done', 'Done!') : tm.run.status === 'running' ? <Pause size="1em" /> : <Play size="1em" />}
              </span>
            </button>
            {isCd && <ProgressBar value={tm.run.status === 'idle' ? 1 : Math.max(0, rem) / tm.durationMs} />}
            {tm.run.status !== 'idle' && (
              <button type="button" className="mtile__reset" onClick={() => actions.multiReset(tm.id)} aria-label={t('a.reset', 'Reset') + ' ' + tm.label}>
                <RotateCcw size="1em" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Settings() {
  const t = useT();
  const [s, set] = useModeSettings('multi');
  const add = () =>
    set((d) => {
      const n = d.timers.length;
      d.timers.push({ id: uid(), label: `${t('mt.timer', 'Timer')} ${n + 1}`, color: COLORS[n % COLORS.length], kind: 'countdown', durationMs: 10 * MIN, run: idleRun() });
    });
  return (
    <Section
      title={t('mt.timers', 'Timers')}
      actions={
        <button type="button" className="btn btn--ghost btn--sm" onClick={add} disabled={s.timers.length >= 12}>
          <Plus size={14} /> {t('a.add', 'Add')}
        </button>
      }
    >
      <ul className="seg-list seg-list--multi">
        {s.timers.map((tm, i) => (
          <li key={tm.id}>
            <input type="color" className="color-dot" value={tm.color} onChange={(e) => set((d) => void (d.timers[i].color = e.target.value))} aria-label={t('a.color', 'Color')} />
            <input className="text-input" value={tm.label} maxLength={30} onChange={(e) => set((d) => void (d.timers[i].label = e.target.value))} aria-label={t('int.label', 'Label')} />
            <Select<MultiTimer['kind']>
              value={tm.kind}
              onChange={(v) =>
                set((d) => {
                  d.timers[i].kind = v;
                  d.timers[i].run = idleRun();
                })
              }
              options={[
                { value: 'countdown', label: t('m.countdown', 'Countdown') },
                { value: 'stopwatch', label: t('m.stopwatch', 'Stopwatch') },
              ]}
            />
            {tm.kind === 'countdown' ? (
              <DurationInput
                ms={tm.durationMs}
                onChange={(ms) =>
                  set((d) => {
                    d.timers[i].durationMs = ms;
                    d.timers[i].run = idleRun();
                  })
                }
                ariaLabel={t('cd.duration', 'Duration')}
              />
            ) : (
              <span />
            )}
            <button type="button" className="mini-btn" aria-label={t('a.remove', 'Remove')} onClick={() => set((d) => void d.timers.splice(i, 1))}>
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
      <p className="muted small">{t('mt.hint', 'Tap a tile on the display to start or pause it. Space starts/pauses all.')}</p>
    </Section>
  );
}
