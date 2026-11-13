import type { ExamSettings, IntervalPhase, IntervalSettings, PresenterSettings, TimerRun } from '../types';
import { elapsed, MIN, SEC } from './time';
import { localTz, zonedParts, zonedToEpoch } from './tz';

export interface Phase {
  label: string;
  kind: IntervalPhase['kind'];
  ms: number;
  round: number; // 1-based work round number within the whole session
}

export function buildPhases(s: IntervalSettings, labels = { work: 'Focus', short: 'Short break', long: 'Long break' }): Phase[] {
  const out: Phase[] = [];
  if (s.preset === 'pomodoro') {
    let round = 0;
    for (let c = 0; c < Math.max(1, s.cycles); c++) {
      for (let i = 1; i <= Math.max(1, s.rounds); i++) {
        round++;
        out.push({ label: labels.work, kind: 'work', ms: s.workMin * MIN, round });
        const lastOfSession = c === Math.max(1, s.cycles) - 1 && i === Math.max(1, s.rounds);
        if (lastOfSession) break;
        if (i < s.rounds) out.push({ label: labels.short, kind: 'rest', ms: s.shortMin * MIN, round });
        else out.push({ label: labels.long, kind: 'long', ms: s.longMin * MIN, round });
      }
    }
  } else {
    let round = 0;
    for (let r = 0; r < Math.max(1, s.repeat); r++) {
      round++;
      for (const p of s.custom) if (p.seconds > 0) out.push({ label: p.label, kind: p.kind, ms: p.seconds * SEC, round });
    }
  }
  return out.filter((p) => p.ms > 0);
}

export interface PhasePos {
  index: number;
  phase: Phase | null;
  next: Phase | null;
  phaseElapsed: number;
  phaseRemaining: number;
  total: number;
  totalElapsed: number;
  done: boolean;
}

export function locate(phases: Phase[], e: number): PhasePos {
  const total = phases.reduce((a, p) => a + p.ms, 0);
  let acc = 0;
  for (let i = 0; i < phases.length; i++) {
    const p = phases[i];
    if (e < acc + p.ms) {
      return {
        index: i,
        phase: p,
        next: phases[i + 1] ?? null,
        phaseElapsed: e - acc,
        phaseRemaining: acc + p.ms - e,
        total,
        totalElapsed: e,
        done: false,
      };
    }
    acc += p.ms;
  }
  return { index: phases.length, phase: null, next: null, phaseElapsed: 0, phaseRemaining: 0, total, totalElapsed: Math.min(e, total), done: true };
}

/** Elapsed value at the start of phase i (used for skip/back). */
export function phaseStart(phases: Phase[], i: number): number {
  return phases.slice(0, Math.max(0, i)).reduce((a, p) => a + p.ms, 0);
}

// ---- Presenter ----
export function presenterRemaining(s: PresenterSettings, run: TimerRun, now: number) {
  const seg = s.segments[s.active] ?? s.segments[0];
  const dur = (seg?.minutes ?? 0) * MIN;
  const e = elapsed(run, now);
  return { seg, dur, elapsed: e, remaining: dur - e };
}

// ---- Exam ----
export type ExamPhase = 'ready' | 'before' | 'reading' | 'writing' | 'finished';

export interface ExamState {
  phase: ExamPhase;
  remaining: number; // ms remaining in the current phase (writing → until end)
  writingTotal: number;
  writingElapsed: number;
  startsAt: number | null; // writing start epoch (scheduled or derived)
  endsAt: number | null;
}

export function hmToEpoch(hm: string, now: number, tz = localTz()): number {
  const p = zonedParts(now, tz);
  const [h, m] = hm.split(':').map(Number);
  return zonedToEpoch(p.year, p.month, p.day, h || 0, m || 0, tz);
}

export function examState(s: ExamSettings, run: TimerRun, now: number, tz = localTz()): ExamState {
  const reading = Math.max(0, s.readingMin) * MIN;
  if (s.kind === 'scheduled') {
    const start = hmToEpoch(s.start, now, tz);
    let end = hmToEpoch(s.end, now, tz);
    if (end <= start) end += 24 * 60 * MIN;
    const writingTotal = end - start;
    const readStart = start - reading;
    if (now < readStart) return { phase: 'before', remaining: readStart - now, writingTotal, writingElapsed: 0, startsAt: start, endsAt: end };
    if (now < start) return { phase: 'reading', remaining: start - now, writingTotal, writingElapsed: 0, startsAt: start, endsAt: end };
    if (now < end) return { phase: 'writing', remaining: end - now, writingTotal, writingElapsed: now - start, startsAt: start, endsAt: end };
    return { phase: 'finished', remaining: 0, writingTotal, writingElapsed: writingTotal, startsAt: start, endsAt: end };
  }
  const writingTotal = Math.max(1, s.durationMin) * MIN;
  const e = elapsed(run, now);
  const running = run.status === 'running';
  const origin = running ? run.anchor - run.acc : null; // epoch when elapsed was 0
  const startsAt = origin !== null ? origin + reading : null;
  const endsAt = origin !== null ? origin + reading + writingTotal : null;
  if (run.status === 'idle') return { phase: 'ready', remaining: writingTotal, writingTotal, writingElapsed: 0, startsAt: null, endsAt: null };
  if (e < reading) return { phase: 'reading', remaining: reading - e, writingTotal, writingElapsed: 0, startsAt, endsAt };
  if (e < reading + writingTotal)
    return { phase: 'writing', remaining: reading + writingTotal - e, writingTotal, writingElapsed: e - reading, startsAt, endsAt };
  return { phase: 'finished', remaining: 0, writingTotal, writingElapsed: writingTotal, startsAt, endsAt };
}
