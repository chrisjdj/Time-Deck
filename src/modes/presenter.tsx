import { ArrowDown, ArrowUp, Plus, Send, X } from 'lucide-react';
import { BigTime, Label, ProgressBar } from '../components/display';
import { Field, NumberInput, Section, Toggle } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { useT } from '../i18n';
import { formatCountdown, idleRun, uid, urgency } from '../lib/time';
import { presenterRemaining } from '../lib/sequence';
import { localTz, timeText } from '../lib/tz';
import { useDeck } from '../store/deck';
import { useModeSettings, type DisplayProps } from './common';
import { useState } from 'react';

export function Display({ config }: DisplayProps) {
  const s = config.settings.presenter;
  const run = config.runtime.presenter;
  const t = useT();
  const now = useNow(run.status === 'running' ? 'fast' : 'second');
  const { seg, dur, remaining } = presenterRemaining(s, run, now);
  const tone = run.status === 'idle' ? 'ok' : urgency(remaining, s.warnAtSec, s.dangerAtSec);
  const over = remaining <= 0 && run.status !== 'idle';
  const next = s.segments[s.active + 1];
  const clock = timeText(now, localTz(), config.appearance.hour12);
  return (
    <div className="m-presenter" data-tone={tone}>
      <div className="m-presenter__top">
        <Label>
          {seg?.title ?? ''} {s.segments.length > 1 && <span className="muted">· {s.active + 1}/{s.segments.length}</span>}
        </Label>
        {s.showClock && (
          <span className="m-presenter__clock">
            {clock.hm} {clock.period}
          </span>
        )}
      </div>
      <BigTime text={over ? '+' + formatCountdown(-remaining) : formatCountdown(remaining)} className={over ? 'is-over' : ''} />
      {s.message ? (
        <div className={'banner' + (s.messageFlash ? ' is-flash' : '')} role="status">
          {s.message}
        </div>
      ) : (
        <Label className={'d-status' + (run.status === 'paused' ? ' is-blink' : '')}>
          {over ? t('pr.over', 'Overtime') : run.status === 'paused' ? t('st.paused', 'Paused') : next ? `${t('pr.next', 'Next')}: ${next.title} (${next.minutes}m)` : ' '}
        </Label>
      )}
      <div className="m-presenter__bar">
        <ProgressBar value={dur ? Math.max(0, remaining) / dur : 0} tone={tone} />
      </div>
    </div>
  );
}

const QUICK_MSGS = ['5 minutes left', 'Wrap up please', 'Time for Q&A', 'Speak up', 'Slow down', 'Thank you!'];

export function Settings() {
  const t = useT();
  const [s, set] = useModeSettings('presenter');
  const update = useDeck((st) => st.update);
  const [msg, setMsg] = useState('');
  const setActive = (i: number) =>
    update((c) => {
      c.settings.presenter.active = i;
      c.runtime.presenter = idleRun();
    });
  const moveSeg = (i: number, j: number) =>
    set((d) => {
      if (j < 0 || j >= d.segments.length) return;
      const [x] = d.segments.splice(i, 1);
      d.segments.splice(j, 0, x);
      if (d.active === i) d.active = j;
      else if (d.active === j) d.active = i;
    });
  return (
    <>
      <Section title={t('pr.message', 'Message to speaker')}>
        <div className="input-row">
          <input
            className="text-input"
            value={msg}
            maxLength={120}
            placeholder={t('pr.msgPh', 'Type a message…')}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && msg.trim()) set((d) => void (d.message = msg.trim()));
            }}
          />
          <button type="button" className="btn btn--primary" disabled={!msg.trim()} onClick={() => set((d) => void (d.message = msg.trim()))}>
            <Send size={16} /> {t('pr.send', 'Show')}
          </button>
        </div>
        <div className="chips">
          {QUICK_MSGS.map((m) => {
            const tm = t('pr.q.' + m, m);
            return (
              <button key={m} type="button" className={'chip' + (s.message === tm ? ' is-active' : '')} onClick={() => set((d) => void (d.message = tm))}>
                {tm}
              </button>
            );
          })}
        </div>
        {s.message && (
          <div className="live-msg">
            <span>
              {t('pr.showing', 'Showing')}: <b>{s.message}</b>
            </span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => set((d) => void (d.message = ''))}>
              {t('pr.clear', 'Clear')}
            </button>
          </div>
        )}
        <Toggle checked={s.messageFlash} onChange={(v) => set((d) => void (d.messageFlash = v))} label={t('pr.flash', 'Flash the message')} />
      </Section>
      <Section
        title={t('pr.agenda', 'Agenda')}
        actions={
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => set((d) => void d.segments.push({ id: uid(), title: t('pr.segment', 'Segment') + ' ' + (d.segments.length + 1), minutes: 5 }))}>
            <Plus size={14} /> {t('a.add', 'Add')}
          </button>
        }
      >
        <ul className="seg-list">
          {s.segments.map((g, i) => (
            <li key={g.id} className={i === s.active ? 'is-active' : ''}>
              <button type="button" className="seg-list__dot" aria-label={t('pr.makeActive', 'Make active')} onClick={() => setActive(i)} />
              <input className="text-input" value={g.title} onChange={(e) => set((d) => void (d.segments[i].title = e.target.value))} aria-label={t('pr.segTitle', 'Segment title')} />
              <NumberInput value={g.minutes} min={0.5} max={600} step={0.5} suffix="min" onChange={(v) => set((d) => void (d.segments[i].minutes = v))} ariaLabel={t('u.minutes', 'minutes')} />
              <button type="button" className="mini-btn" aria-label={t('a.moveUp', 'Move up')} onClick={() => moveSeg(i, i - 1)} disabled={i === 0}>
                <ArrowUp size={14} />
              </button>
              <button type="button" className="mini-btn" aria-label={t('a.moveDown', 'Move down')} onClick={() => moveSeg(i, i + 1)} disabled={i === s.segments.length - 1}>
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                className="mini-btn"
                aria-label={t('a.remove', 'Remove')}
                disabled={s.segments.length <= 1}
                onClick={() =>
                  set((d) => {
                    d.segments.splice(i, 1);
                    d.active = Math.min(d.active, d.segments.length - 1);
                  })
                }
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
        <p className="muted small">{t('pr.agendaHint', 'Use N / P (or a presentation clicker) to move between segments.')}</p>
      </Section>
      <Section title={t('cd.alerts', 'Colors & alerts')}>
        <Field label={t('cd.warnAt', 'Turn amber at')} inline>
          <NumberInput value={s.warnAtSec} min={0} max={36000} onChange={(v) => set((d) => void (d.warnAtSec = v))} suffix={t('u.sec', 'sec')} />
        </Field>
        <Field label={t('cd.dangerAt', 'Turn red at')} inline>
          <NumberInput value={s.dangerAtSec} min={0} max={36000} onChange={(v) => set((d) => void (d.dangerAtSec = v))} suffix={t('u.sec', 'sec')} />
        </Field>
        <Toggle checked={s.showClock} onChange={(v) => set((d) => void (d.showClock = v))} label={t('pr.clock', 'Show current time')} />
      </Section>
    </>
  );
}
