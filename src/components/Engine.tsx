import { useEffect, useRef } from 'react';
import { AlarmClock, BellOff } from 'lucide-react';
import { useDeck } from '../store/deck';
import { useFlash } from '../store/flash';
import { computeSignals, dueSignals } from '../lib/signals';
import { dueAlarms, dueReminders } from '../lib/alarms';
import { notify, playSound, speak } from '../lib/audio';
import { sync } from '../lib/sync';
import { currentLocale, currentT, useT } from '../i18n';
import { elapsed, formatCountdown, formatStopwatch, MIN, uid } from '../lib/time';
import { buildPhases, examState, locate, presenterRemaining } from '../lib/sequence';
import { localTz, timeText } from '../lib/tz';
import { isIsolated } from '../store/deck';
import type { DeckConfig } from '../types';

// ---- Flash banner + live region (per window) ----
export function FlashBanner() {
  const { text, kind, at } = useFlash();
  const visible = !!text;
  useEffect(() => {
    if (!text) return;
    const h = setTimeout(() => useFlash.setState({ text: '' }), 5000);
    return () => clearTimeout(h);
  }, [text, at]);
  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {text}
      </div>
      {visible && (
        <div className={'flash flash--' + kind} key={at} aria-hidden>
          {text}
        </div>
      )}
    </>
  );
}

function titleFor(c: DeckConfig, now: number): string | null {
  const rt = c.runtime;
  switch (c.mode) {
    case 'countdown':
      if (rt.countdown.status === 'idle') return null;
      return formatCountdown(c.settings.countdown.durationMs - elapsed(rt.countdown, now));
    case 'stopwatch':
      return rt.stopwatch.status === 'idle' ? null : formatStopwatch(elapsed(rt.stopwatch, now), false);
    case 'presenter':
      return rt.presenter.status === 'idle' ? null : formatCountdown(presenterRemaining(c.settings.presenter, rt.presenter, now).remaining);
    case 'intervals': {
      if (rt.intervals.status === 'idle') return null;
      const pos = locate(buildPhases(c.settings.intervals), elapsed(rt.intervals, now));
      return pos.done ? null : `${formatCountdown(pos.phaseRemaining)} ${pos.phase?.label ?? ''}`;
    }
    case 'exam': {
      const st = examState(c.settings.exam, rt.exam, now);
      return st.phase === 'reading' || st.phase === 'writing' ? formatCountdown(st.remaining) : null;
    }
    default:
      return null;
  }
}

/** Fires timer signals, alarms and reminders. Mounted once per window. */
export function Engine() {
  const fired = useRef(new Set<string>());
  const lastAlarmSound = useRef(0);

  useEffect(() => {
    // Seed with already-past signals so a reload never replays them.
    const now0 = Date.now();
    computeSignals(useDeck.getState().config, now0, currentT()).forEach((s) => s.at <= now0 && fired.current.add(s.id));

    const h = window.setInterval(() => {
      const st = useDeck.getState();
      const now = Date.now();
      const t = currentT();
      const leader = sync.isLeader();
      const { sound } = st.config;

      for (const s of dueSignals(computeSignals(st.config, now, t), now, fired.current)) {
        fired.current.add(s.id);
        useFlash.getState().show(s.text, s.kind);
        if (!leader) continue;
        if (sound.enabled) playSound(sound.kind, s.kind === 'end' ? 'end' : s.kind === 'warn' ? 'warn' : 'phase', sound.volume);
        if (sound.speech && s.speech) setTimeout(() => speak(s.speech!, currentLocale(), sound.volume), s.kind === 'end' ? 2200 : 900);
        if (sound.notify && (s.kind === 'end' || s.kind === 'phase')) void notify('Time-Deck', s.text);
      }

      // Alarms & reminders — leader only, never in isolated share/embed windows.
      if (leader && !isIsolated()) {
        const firedKeys = new Set(st.firedKeys);
        const due = dueAlarms(st.alarms, now, firedKeys);
        const rem = dueReminders(st.reminders, now);
        if (due.length || rem.length) {
          const first = due[0];
          const r0 = rem[0];
          const alert = first
            ? { id: first.key, label: first.alarm.label || t('al.alarm', 'Alarm'), firedAt: now, sourceId: first.alarm.id, source: 'alarm' as const }
            : { id: r0.id, label: r0.label || t('al.reminder', 'Reminder'), firedAt: now, sourceId: r0.id, source: 'reminder' as const };
          st.patch({
            alert,
            firedKeys: [...st.firedKeys, ...due.map((d) => d.key)].slice(-100),
            reminders: st.reminders.filter((x) => !rem.includes(x)),
            alarms: st.alarms.map((a) => (due.some((d) => d.alarm.id === a.id) && a.days.length === 0 ? { ...a, enabled: false } : a)),
          });
          if (sound.notify) void notify('⏰ ' + alert.label, timeText(now, localTz(), st.config.appearance.hour12).hm);
        }
        // Ring while an alert is open (max 5 minutes).
        const al = useDeck.getState().alert;
        if (al && now - al.firedAt < 5 * MIN && now - lastAlarmSound.current > 4000) {
          lastAlarmSound.current = now;
          playSound(sound.kind === 'beep' ? 'beep' : 'bell', 'alarm', Math.max(0.4, sound.volume));
        }
      }

      const title = titleFor(st.config, now);
      document.title = title ? `${title} · Time-Deck` : 'Time-Deck — Clocks, Timers & World Time';
    }, 250);
    return () => clearInterval(h);
  }, []);

  return null;
}

export function AlertOverlay() {
  const alert = useDeck((s) => s.alert);
  const patch = useDeck((s) => s.patch);
  const reminders = useDeck((s) => s.reminders);
  const hour12 = useDeck((s) => s.config.appearance.hour12);
  const t = useT();
  if (!alert) return null;
  const tt = timeText(alert.firedAt, localTz(), hour12);
  const snooze = (min: number) =>
    patch({ alert: null, reminders: [...reminders, { id: uid(), label: alert.label, at: Date.now() + min * MIN }] });
  return (
    <div className="alert-overlay" role="alertdialog" aria-modal="true" aria-labelledby="alert-title">
      <div className="alert-overlay__card">
        <AlarmClock className="alert-overlay__icon" size={64} />
        <div className="alert-overlay__time">
          {tt.hm}
          {tt.period && <small> {tt.period}</small>}
        </div>
        <h2 id="alert-title">{alert.label}</h2>
        <div className="alert-overlay__actions">
          <button type="button" className="btn btn--lg" onClick={() => snooze(5)}>
            {t('al.snooze', 'Snooze {n} min', { n: 5 })}
          </button>
          <button type="button" className="btn btn--lg" onClick={() => snooze(10)}>
            {t('al.snooze', 'Snooze {n} min', { n: 10 })}
          </button>
          <button type="button" className="btn btn--lg btn--primary" autoFocus onClick={() => patch({ alert: null })}>
            <BellOff size={18} /> {t('al.dismiss', 'Dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
}
