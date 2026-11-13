import type { DeckConfig } from '../types';
import type { TFn } from '../i18n';
import { MIN, SEC } from './time';
import { buildPhases, examState, presenterRemaining } from './sequence';
import { parseLocalIso, localTz } from './tz';
import { getCity } from '../data/cities';

export type SignalKind = 'end' | 'warn' | 'phase' | 'milestone';

export interface Signal {
  id: string;
  at: number; // epoch when it should fire
  kind: SignalKind;
  text: string;
  speech?: string;
}

/** Signals fire if their time passed within this window (avoids replaying old events after reload). */
export const FIRE_WINDOW = 2500;

function remainingWords(t: TFn, min: number): string {
  return min === 1 ? t('sig.oneMinute', 'One minute remaining') : t('sig.minutes', '{n} minutes remaining', { n: min });
}

/** All timed events derivable from the current config. Pure: easy to test. */
export function computeSignals(c: DeckConfig, now: number, t: TFn): Signal[] {
  const out: Signal[] = [];
  const s = c.settings;
  const rt = c.runtime;

  // Countdown
  if (rt.countdown.status === 'running') {
    const origin = rt.countdown.anchor - rt.countdown.acc;
    const end = origin + s.countdown.durationMs;
    const tag = `cd:${origin}:${s.countdown.durationMs}`;
    out.push({ id: tag + ':end', at: end, kind: 'end', text: s.countdown.title || t('sig.timeUp', "Time's up"), speech: t('sig.timeUp', "Time's up") });
    if (s.countdown.durationMs > 2 * MIN)
      out.push({ id: tag + ':1m', at: end - MIN, kind: 'warn', text: remainingWords(t, 1), speech: remainingWords(t, 1) });
  }

  // Presenter
  if (rt.presenter.status === 'running') {
    const p = presenterRemaining(s.presenter, rt.presenter, now);
    const origin = rt.presenter.anchor - rt.presenter.acc;
    const end = origin + p.dur;
    const tag = `pr:${s.presenter.active}:${origin}:${p.dur}`;
    if (p.dur > s.presenter.warnAtSec * SEC)
      out.push({ id: tag + ':warn', at: end - s.presenter.warnAtSec * SEC, kind: 'warn', text: t('sig.wrapUp', 'Start wrapping up') });
    if (p.dur > s.presenter.dangerAtSec * SEC)
      out.push({ id: tag + ':danger', at: end - s.presenter.dangerAtSec * SEC, kind: 'warn', text: t('sig.almostOut', 'Almost out of time') });
    out.push({ id: tag + ':end', at: end, kind: 'end', text: t('sig.timeUp', "Time's up") });
  }

  // Intervals
  if (rt.intervals.status === 'running') {
    const phases = buildPhases(s.intervals, {
      work: t('int.focus', 'Focus'),
      short: t('int.short', 'Short break'),
      long: t('int.long', 'Long break'),
    });
    const origin = rt.intervals.anchor - rt.intervals.acc;
    let acc = 0;
    phases.forEach((p, i) => {
      acc += p.ms;
      const next = phases[i + 1];
      out.push({
        id: `iv:${origin}:${i}`,
        at: origin + acc,
        kind: next ? 'phase' : 'end',
        text: next ? next.label : t('int.complete', 'Session complete'),
        speech: next ? next.label : t('int.complete', 'Session complete'),
      });
    });
  }

  // Exam
  const exam = s.exam;
  if (exam.kind === 'scheduled' ? c.mode === 'exam' : rt.exam.status === 'running') {
    const st = examState(exam, rt.exam, now);
    if (st.startsAt && st.endsAt) {
      const tag = `ex:${st.startsAt}:${st.endsAt}`;
      if (exam.readingMin > 0) out.push({ id: tag + ':write', at: st.startsAt, kind: 'phase', text: t('exam.begin', 'You may begin writing'), speech: t('exam.begin', 'You may begin writing') });
      for (const m of exam.milestones) {
        const at = st.endsAt - m * MIN;
        if (at > st.startsAt) out.push({ id: `${tag}:m${m}`, at, kind: 'milestone', text: remainingWords(t, m), speech: remainingWords(t, m) });
      }
      out.push({ id: tag + ':end', at: st.endsAt, kind: 'end', text: t('exam.stop', 'Time is up — stop writing'), speech: t('exam.stop', 'Time is up — stop writing') });
    }
  }

  // Multi timers
  for (const mt of s.multi.timers) {
    if (mt.kind !== 'countdown' || mt.run.status !== 'running') continue;
    const origin = mt.run.anchor - mt.run.acc;
    out.push({ id: `mt:${mt.id}:${origin}:${mt.durationMs}`, at: origin + mt.durationMs, kind: 'end', text: t('sig.done', '{label} done', { label: mt.label }), speech: t('sig.done', '{label} done', { label: mt.label }) });
  }

  // Event countdown (only while showing it)
  if (c.mode === 'event') {
    const tz = s.event.city ? getCity(s.event.city)?.tz ?? localTz() : localTz();
    const at = parseLocalIso(s.event.target, tz);
    if (at) out.push({ id: `ev:${at}`, at, kind: 'end', text: s.event.title || t('sig.event', 'Event'), speech: s.event.title });
  }

  return out;
}

export function dueSignals(signals: Signal[], now: number, fired: Set<string>): Signal[] {
  return signals.filter((s) => s.at <= now && now - s.at < FIRE_WINDOW && !fired.has(s.id));
}
