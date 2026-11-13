import { describe, expect, it } from 'vitest';
import { elapsed, formatCountdown, formatStopwatch, idleRun, lapRows, MIN, parseDuration, pauseRun, SEC, shiftRun, startRun, toggleRun, urgency } from '../src/lib/time';

describe('anchor-based timer runs', () => {
  it('accumulates across pause/resume without drift', () => {
    let r = idleRun();
    r = startRun(r, 1000);
    expect(elapsed(r, 6000)).toBe(5000);
    r = pauseRun(r, 6000);
    expect(elapsed(r, 60_000)).toBe(5000); // paused: time frozen
    r = startRun(r, 100_000);
    expect(elapsed(r, 103_500)).toBe(8500);
  });

  it('survives a reload (state is plain data computed from wall clock)', () => {
    const r = JSON.parse(JSON.stringify(startRun(idleRun(), 10_000)));
    expect(elapsed(r, 70_000)).toBe(60_000);
  });

  it('toggle starts and pauses', () => {
    let r = toggleRun(idleRun(), 0);
    expect(r.status).toBe('running');
    r = toggleRun(r, 2000);
    expect(r).toEqual({ status: 'paused', anchor: 0, acc: 2000 });
  });

  it('shiftRun never goes below zero', () => {
    const r = startRun(idleRun(), 0);
    expect(elapsed(shiftRun(r, -10 * MIN, 5000), 5000)).toBe(0);
    expect(elapsed(shiftRun(r, 2000, 5000), 5000)).toBe(7000);
  });
});

describe('formatting', () => {
  it('countdown rounds up so 0:00 only shows at the end', () => {
    expect(formatCountdown(59_001)).toBe('1:00');
    expect(formatCountdown(1)).toBe('0:01');
    expect(formatCountdown(0)).toBe('0:00');
    expect(formatCountdown(3_600_000)).toBe('1:00:00');
    expect(formatCountdown(-61_000)).toBe('-1:01');
    expect(formatCountdown(5 * MIN, { forceHours: true })).toBe('0:05:00');
  });

  it('stopwatch shows centiseconds and rounds down', () => {
    expect(formatStopwatch(61_239)).toBe('01:01.23');
    expect(formatStopwatch(3_723_450)).toBe('1:02:03.45');
    expect(formatStopwatch(999, false)).toBe('00:00');
  });

  it('parses human durations', () => {
    expect(parseDuration('5')).toBe(5 * MIN);
    expect(parseDuration('1:30')).toBe(90 * SEC);
    expect(parseDuration('1:00:00')).toBe(60 * MIN);
    expect(parseDuration('1h 20m')).toBe(80 * MIN);
    expect(parseDuration('45s')).toBe(45 * SEC);
    expect(parseDuration('1.5 hours')).toBe(90 * MIN);
    expect(parseDuration('abc')).toBeNull();
    expect(parseDuration('')).toBeNull();
  });
});

describe('laps', () => {
  it('computes lap times, splits and best/worst', () => {
    const rows = lapRows([10_000, 25_000, 32_000]);
    expect(rows.map((r) => r.lap)).toEqual([10_000, 15_000, 7_000]);
    expect(rows.map((r) => r.split)).toEqual([10_000, 25_000, 32_000]);
    expect(rows[2].best).toBe(true);
    expect(rows[1].worst).toBe(true);
  });
  it('does not mark best/worst with a single lap', () => {
    expect(lapRows([5000])[0]).toMatchObject({ best: false, worst: false });
  });
});

describe('urgency', () => {
  it('maps thresholds', () => {
    expect(urgency(120_000, 60, 15)).toBe('ok');
    expect(urgency(60_000, 60, 15)).toBe('warn');
    expect(urgency(10_000, 60, 15)).toBe('danger');
    expect(urgency(0, 60, 15)).toBe('over');
  });
});
