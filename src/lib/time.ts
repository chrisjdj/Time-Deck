import type { TimerRun } from '../types';

export const SEC = 1000;
export const MIN = 60 * SEC;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export const idleRun = (): TimerRun => ({ status: 'idle', anchor: 0, acc: 0 });

export function elapsed(run: TimerRun, now: number): number {
  return run.acc + (run.status === 'running' ? Math.max(0, now - run.anchor) : 0);
}

export function startRun(run: TimerRun, now: number): TimerRun {
  if (run.status === 'running') return run;
  return { status: 'running', anchor: now, acc: run.acc };
}

export function pauseRun(run: TimerRun, now: number): TimerRun {
  if (run.status !== 'running') return run;
  return { status: 'paused', anchor: 0, acc: elapsed(run, now) };
}

export function toggleRun(run: TimerRun, now: number): TimerRun {
  return run.status === 'running' ? pauseRun(run, now) : startRun(run, now);
}

/** Shift elapsed time by delta (positive = more elapsed). Never below zero. */
export function shiftRun(run: TimerRun, delta: number, now: number): TimerRun {
  const e = elapsed(run, now);
  const target = Math.max(0, e + delta);
  return { ...run, acc: run.acc + (target - e) };
}

export function pad(n: number, len = 2): string {
  return String(Math.floor(Math.abs(n))).padStart(len, '0');
}

export interface Parts {
  neg: boolean;
  d: number;
  h: number;
  m: number;
  s: number;
  cs: number; // centiseconds
  ds: number; // deciseconds
}

export function splitMs(ms: number): Parts {
  const neg = ms < 0;
  const a = Math.abs(ms);
  return {
    neg,
    d: Math.floor(a / DAY),
    h: Math.floor((a % DAY) / HOUR),
    m: Math.floor((a % HOUR) / MIN),
    s: Math.floor((a % MIN) / SEC),
    cs: Math.floor((a % SEC) / 10),
    ds: Math.floor((a % SEC) / 100),
  };
}

/** Countdown display: rounds UP so "0:01" shows for the last second and 0 only at the end. */
export function formatCountdown(remainingMs: number, opts: { tenths?: boolean; forceHours?: boolean } = {}): string {
  if (remainingMs > 0 && !opts.tenths) remainingMs = Math.ceil(remainingMs / SEC) * SEC;
  const p = splitMs(remainingMs);
  const totalH = p.d * 24 + p.h;
  const sign = p.neg ? '-' : '';
  const core = totalH > 0 || opts.forceHours ? `${totalH}:${pad(p.m)}:${pad(p.s)}` : `${p.m}:${pad(p.s)}`;
  return sign + core + (opts.tenths ? `.${p.ds}` : '');
}

/** Stopwatch display: rounds DOWN, with centiseconds. */
export function formatStopwatch(ms: number, cs = true): string {
  const p = splitMs(ms);
  const totalH = p.d * 24 + p.h;
  const core = totalH > 0 ? `${totalH}:${pad(p.m)}:${pad(p.s)}` : `${pad(p.m)}:${pad(p.s)}`;
  return core + (cs ? `.${pad(p.cs)}` : '');
}

export function formatDuration(ms: number): string {
  return formatCountdown(ms);
}

/** Parse "1:30", "90", "1h 5m", "10m", "45s", "1:00:00" into ms. Returns null when invalid. */
export function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;
  if (/^\d+(:\d{1,2}){0,2}$/.test(s)) {
    const parts = s.split(':').map(Number);
    if (parts.length === 1) return parts[0] * MIN; // bare number = minutes
    if (parts.length === 2) return parts[0] * MIN + parts[1] * SEC;
    return parts[0] * HOUR + parts[1] * MIN + parts[2] * SEC;
  }
  const re = /(\d+(?:\.\d+)?)\s*(h|hr|hrs|hours?|m|min|mins|minutes?|s|sec|secs|seconds?)/g;
  let total = 0;
  let matched = false;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    matched = true;
    const v = parseFloat(m[1]);
    const u = m[2][0];
    total += u === 'h' ? v * HOUR : u === 'm' ? v * MIN : v * SEC;
  }
  return matched ? Math.round(total) : null;
}

export interface LapRow {
  index: number;
  lap: number;
  split: number;
  best: boolean;
  worst: boolean;
}

/** laps = cumulative elapsed marks. */
export function lapRows(laps: number[]): LapRow[] {
  const rows = laps.map((split, i) => ({ index: i + 1, split, lap: split - (i ? laps[i - 1] : 0), best: false, worst: false }));
  if (rows.length >= 2) {
    let bi = 0;
    let wi = 0;
    rows.forEach((r, i) => {
      if (r.lap < rows[bi].lap) bi = i;
      if (r.lap > rows[wi].lap) wi = i;
    });
    rows[bi].best = true;
    rows[wi].worst = true;
  }
  return rows;
}

export function lapsCsv(laps: number[]): string {
  return ['Lap,Lap time,Split', ...lapRows(laps).map((r) => `${r.index},${formatStopwatch(r.lap)},${formatStopwatch(r.split)}`)].join('\n');
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Threshold color state for countdown-like displays. */
export function urgency(remainingMs: number, warnSec: number, dangerSec: number): 'ok' | 'warn' | 'danger' | 'over' {
  if (remainingMs <= 0) return 'over';
  if (remainingMs <= dangerSec * SEC) return 'danger';
  if (remainingMs <= warnSec * SEC) return 'warn';
  return 'ok';
}
