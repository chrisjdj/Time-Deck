import { describe, expect, it } from 'vitest';
import { buildPhases, examState, locate, phaseStart } from '../src/lib/sequence';
import { dueAlarms, nextFire } from '../src/lib/alarms';
import { moonInfo, moonPhaseName, nightPolygon, subsolarPoint, sunAltitude } from '../src/lib/solar';
import { litWords, WORD_GRID } from '../src/lib/wordclock';
import { computeSignals, dueSignals } from '../src/lib/signals';
import { defaultConfig, normalizeConfig } from '../src/store/defaults';
import { idleRun, MIN, startRun } from '../src/lib/time';
import { makeT } from '../src/i18n/makeT';
import type { Alarm } from '../src/types';

const utc = (s: string) => Date.parse(s);
const t = makeT('en');

describe('interval sequencer', () => {
  const base = defaultConfig().settings.intervals;

  it('builds a classic pomodoro set without a trailing break', () => {
    const p = buildPhases({ ...base, preset: 'pomodoro', workMin: 25, shortMin: 5, longMin: 15, rounds: 4, cycles: 1 });
    expect(p.map((x) => x.kind)).toEqual(['work', 'rest', 'work', 'rest', 'work', 'rest', 'work']);
  });

  it('inserts long breaks between sets', () => {
    const p = buildPhases({ ...base, preset: 'pomodoro', rounds: 2, cycles: 2 });
    expect(p.map((x) => x.kind)).toEqual(['work', 'rest', 'work', 'long', 'work', 'rest', 'work']);
  });

  it('locates position within phases', () => {
    const p = buildPhases({ ...base, preset: 'custom', repeat: 2, custom: [
      { id: 'a', label: 'Work', seconds: 40, kind: 'work' },
      { id: 'b', label: 'Rest', seconds: 20, kind: 'rest' },
    ] });
    expect(p).toHaveLength(4);
    const pos = locate(p, 50_000);
    expect(pos.index).toBe(1);
    expect(pos.phaseRemaining).toBe(10_000);
    expect(pos.next?.label).toBe('Work');
    expect(locate(p, 240_000).done).toBe(true);
    expect(phaseStart(p, 2)).toBe(60_000);
  });
});

describe('exam state', () => {
  const s = { ...defaultConfig().settings.exam, kind: 'manual' as const, durationMin: 60, readingMin: 10 };
  it('walks reading → writing → finished', () => {
    const run = startRun(idleRun(), 0);
    expect(examState(s, idleRun(), 0).phase).toBe('ready');
    expect(examState(s, run, 5 * MIN).phase).toBe('reading');
    const w = examState(s, run, 30 * MIN);
    expect(w.phase).toBe('writing');
    expect(w.remaining).toBe(40 * MIN);
    expect(w.endsAt).toBe(70 * MIN);
    expect(examState(s, run, 71 * MIN).phase).toBe('finished');
  });
  it('scheduled exams follow the wall clock', () => {
    const sch = { ...s, kind: 'scheduled' as const, start: '09:00', end: '11:00', readingMin: 15 };
    const day = (h: number, m = 0) => Date.UTC(2026, 10, 13, h, m);
    expect(examState(sch, idleRun(), day(8, 0), 'UTC').phase).toBe('before');
    expect(examState(sch, idleRun(), day(8, 50), 'UTC').phase).toBe('reading');
    expect(examState(sch, idleRun(), day(10, 0), 'UTC').remaining).toBe(60 * MIN);
    expect(examState(sch, idleRun(), day(11, 1), 'UTC').phase).toBe('finished');
  });
});

describe('alarms', () => {
  const mk = (p: Partial<Alarm>): Alarm => ({ id: 'a', label: '', time: '07:30', days: [], enabled: true, createdAt: 0, ...p });

  it('next fire for one-off alarm is the next occurrence after creation', () => {
    const now = utc('2026-11-13T08:00:00Z');
    expect(nextFire(mk({ createdAt: now }), now, 'UTC')).toBe(utc('2026-11-14T07:30:00Z'));
  });

  it('respects weekday selection (Mon-Fri) over a weekend', () => {
    const fri = utc('2026-11-13T08:00:00Z'); // Friday
    expect(nextFire(mk({ days: [1, 2, 3, 4, 5] }), fri, 'UTC')).toBe(utc('2026-11-16T07:30:00Z'));
  });

  it('handles DST: 07:30 local in New York either side of the November change', () => {
    const daily = mk({ days: [0, 1, 2, 3, 4, 5, 6] });
    // Fri 30 Oct 08:00 EDT -> Sat 31 Oct 07:30 EDT (UTC-4)
    expect(nextFire(daily, utc('2026-10-30T12:00:00Z'), 'America/New_York')).toBe(utc('2026-10-31T11:30:00Z'));
    // Sun 1 Nov 08:00 EST -> Mon 2 Nov 07:30 EST (UTC-5)
    expect(nextFire(daily, utc('2026-11-01T13:00:00Z'), 'America/New_York')).toBe(utc('2026-11-02T12:30:00Z'));
  });

  it('fires once within the grace window and handles midnight', () => {
    const a = mk({ time: '23:59', days: [0, 1, 2, 3, 4, 5, 6] });
    const now = utc('2026-11-14T00:01:00Z');
    const due = dueAlarms([a], now, new Set(), 'UTC');
    expect(due).toHaveLength(1);
    expect(dueAlarms([a], now, new Set([due[0].key]), 'UTC')).toHaveLength(0);
    expect(dueAlarms([a], utc('2026-11-14T00:10:00Z'), new Set(), 'UTC')).toHaveLength(0); // outside grace
  });

  it('disabled alarms never fire', () => {
    expect(nextFire(mk({ enabled: false }), 0, 'UTC')).toBeNull();
  });
});

describe('solar & moon', () => {
  it('subsolar latitude tracks the seasons', () => {
    expect(subsolarPoint(utc('2026-06-21T12:00:00Z')).lat).toBeCloseTo(23.44, 0);
    expect(subsolarPoint(utc('2026-12-21T12:00:00Z')).lat).toBeCloseTo(-23.44, 0);
    expect(Math.abs(subsolarPoint(utc('2026-03-20T12:00:00Z')).lat)).toBeLessThan(1);
  });
  it('subsolar longitude is near 0 at 12:00 UTC (equation of time < 5°)', () => {
    expect(Math.abs(subsolarPoint(utc('2026-04-15T12:00:00Z')).lon)).toBeLessThan(5);
  });
  it('sun is up at noon in Greenwich and down at midnight', () => {
    expect(sunAltitude(utc('2026-06-21T12:00:00Z'), 51.48, 0)).toBeGreaterThan(55);
    expect(sunAltitude(utc('2026-06-21T00:00:00Z'), 51.48, 0)).toBeLessThan(0);
  });
  it('night polygon closes at the dark pole', () => {
    const june = nightPolygon(utc('2026-06-21T12:00:00Z'));
    expect(june.at(-1)![1]).toBe(-90);
    const dec = nightPolygon(utc('2026-12-21T12:00:00Z'));
    expect(dec.at(-1)![1]).toBe(90);
  });
  it('moon phase matches a known full moon (2026-03-03) and new moon (2026-02-17)', () => {
    expect(moonInfo(utc('2026-03-03T11:38:00Z')).name).toBe('full');
    expect(moonInfo(utc('2026-02-17T12:01:00Z')).name).toBe('new');
    expect(moonPhaseName(0.25)).toBe('firstQuarter');
  });
});

describe('word clock', () => {
  it('has a rectangular grid', () => {
    const widths = new Set(WORD_GRID.map((r) => r.length));
    expect(widths.size).toBe(1);
  });
  it('reads common times', () => {
    expect(litWords(10, 30).sentence).toBe('It is half past ten');
    expect(litWords(10, 47).sentence).toBe('It is quarter to eleven');
    expect(litWords(10, 47).dots).toBe(2);
    expect(litWords(0, 0).sentence).toBe("It is twelve o'clock");
    expect(litWords(23, 55).sentence).toBe('It is five minutes to twelve');
  });
  it('every lit word exists in the grid', () => {
    const inGrid = new Set(WORD_GRID.flat().map((l) => l.word));
    for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 5) litWords(h, m).words.forEach((w) => expect(inGrid.has(w)).toBe(true));
  });
});

describe('signals', () => {
  it('fires countdown end exactly once inside the window', () => {
    const c = defaultConfig();
    c.settings.countdown.durationMs = 5 * MIN;
    c.runtime.countdown = startRun(idleRun(), 0);
    const sigs = computeSignals(c, 0, t);
    const end = sigs.find((s) => s.kind === 'end')!;
    expect(end.at).toBe(5 * MIN);
    expect(sigs.some((s) => s.kind === 'warn' && s.at === 4 * MIN)).toBe(true);
    const fired = new Set<string>();
    expect(dueSignals(sigs, 5 * MIN + 100, fired)).toHaveLength(1);
    fired.add(end.id);
    expect(dueSignals(sigs, 5 * MIN + 200, fired)).toHaveLength(0);
    expect(dueSignals(sigs, 5 * MIN + 10_000, new Set())).toHaveLength(0); // too old: no replay after reload
  });

  it('emits one signal per interval phase boundary', () => {
    const c = defaultConfig();
    c.settings.intervals = { ...c.settings.intervals, preset: 'custom', repeat: 2 };
    c.runtime.intervals = startRun(idleRun(), 0);
    const sigs = computeSignals(c, 0, t).filter((s) => s.id.startsWith('iv:'));
    expect(sigs).toHaveLength(4);
    expect(sigs.at(-1)!.kind).toBe('end');
  });
});

describe('config migration', () => {
  it('fills missing fields from defaults and ignores type mismatches', () => {
    const c = normalizeConfig({ mode: 'world', appearance: { accent: '#ff0000', scale: 'big' }, settings: { world: { cities: ['tokyo'] } } });
    expect(c.mode).toBe('world');
    expect(c.appearance.accent).toBe('#ff0000');
    expect(c.appearance.scale).toBe(1);
    expect(c.settings.world.cities).toEqual(['tokyo']);
    expect(c.settings.countdown.durationMs).toBe(5 * MIN);
  });
});
