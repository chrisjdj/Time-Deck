import type { DeckConfig } from '../types';
import { idleRun, MIN } from '../lib/time';
import { localCity } from '../data/cities';

function nextNewYear(): string {
  const y = new Date().getFullYear() + 1;
  return `${y}-01-01T00:00`;
}

export function defaultConfig(): DeckConfig {
  const local = localCity().id;
  const world = Array.from(new Set([local, 'london', 'new-york', 'tokyo', 'sydney'])).slice(0, 5);
  return {
    v: 1,
    mode: 'clock',
    appearance: {
      style: 'minimal',
      accent: '#7c5cff',
      font: 'outfit',
      scale: 1,
      bg: 'style',
      bgColor: '#0b1020',
      bgColor2: '#3b1d6e',
      bgImageId: '',
      showLabels: true,
      pixelShift: false,
      hour12: (() => {
        try {
          return new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12 ?? false;
        } catch {
          return false;
        }
      })(),
      touchMode: false,
    },
    sound: { enabled: true, volume: 0.7, kind: 'chime', speech: false, notify: true },
    settings: {
      clock: { face: 'digital', showSeconds: true, showDate: true, city: '', showUtc: false, showIsoWeek: false, showUnix: false },
      world: { cities: world, showSeconds: false, showSun: true, showOffset: true },
      map: { cities: world, showLabels: true },
      meeting: { cities: world.slice(0, 4), workStart: 9, workEnd: 18, dateOffset: 0, selectedHour: null },
      countdown: { durationMs: 5 * MIN, overtime: true, warnAtSec: 60, dangerAtSec: 15, showProgress: true, showTenths: false, title: '' },
      event: { title: 'New Year', target: nextNewYear(), city: '', countUpAfter: true },
      stopwatch: { showLaps: true },
      presenter: {
        segments: [
          { id: 's1', title: 'Introduction', minutes: 5 },
          { id: 's2', title: 'Main talk', minutes: 20 },
          { id: 's3', title: 'Q&A', minutes: 10 },
        ],
        active: 0,
        warnAtSec: 120,
        dangerAtSec: 30,
        message: '',
        messageFlash: false,
        showClock: true,
      },
      intervals: {
        preset: 'pomodoro',
        workMin: 25,
        shortMin: 5,
        longMin: 15,
        rounds: 4,
        cycles: 1,
        custom: [
          { id: 'w', label: 'Work', seconds: 40, kind: 'work' },
          { id: 'r', label: 'Rest', seconds: 20, kind: 'rest' },
        ],
        repeat: 8,
      },
      multi: {
        timers: [
          { id: 'm1', label: 'Pasta', color: '#f59e0b', kind: 'countdown', durationMs: 9 * MIN, run: idleRun() },
          { id: 'm2', label: 'Sauce', color: '#ef4444', kind: 'countdown', durationMs: 20 * MIN, run: idleRun() },
          { id: 'm3', label: 'Oven', color: '#10b981', kind: 'countdown', durationMs: 35 * MIN, run: idleRun() },
          { id: 'm4', label: 'Elapsed', color: '#3b82f6', kind: 'stopwatch', durationMs: 0, run: idleRun() },
        ],
      },
      exam: {
        title: 'Examination',
        kind: 'manual',
        durationMin: 90,
        readingMin: 10,
        start: '09:00',
        end: '11:00',
        milestones: [30, 10, 5],
        notice: 'Phones off and in bags.\nWrite your name on every page.',
        showClock: true,
      },
      fun: { binaryLabels: true, progressBars: ['day', 'week', 'month', 'year'], moonCity: '' },
    },
    runtime: {
      countdown: idleRun(),
      stopwatch: { ...idleRun(), laps: [] },
      presenter: idleRun(),
      intervals: idleRun(),
      exam: idleRun(),
    },
  };
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);

/** Deep-merge a possibly old/partial config onto defaults so new fields always exist. */
export function mergeDeep<T>(base: T, patch: unknown): T {
  if (!isObj(base) || !isObj(patch)) return (patch === undefined ? base : (patch as T));
  const out: Obj = { ...base };
  for (const k of Object.keys(patch)) {
    const bv = (base as Obj)[k];
    const pv = patch[k];
    if (pv === undefined) continue;
    if (isObj(bv) && isObj(pv)) out[k] = mergeDeep(bv, pv);
    else if (bv !== undefined && typeof bv !== typeof pv) continue; // type mismatch → keep default
    else out[k] = pv;
  }
  return out as T;
}

export function normalizeConfig(raw: unknown): DeckConfig {
  return mergeDeep(defaultConfig(), raw);
}
