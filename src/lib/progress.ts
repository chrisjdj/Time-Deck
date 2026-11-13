import { zonedParts, zonedToEpoch } from './tz';

export type ProgressKind = 'day' | 'week' | 'month' | 'year';

/** Fraction (0..1) of the current day / ISO week / month / year elapsed in tz. */
export function progressOf(kind: ProgressKind, now: number, tz: string): number {
  const p = zonedParts(now, tz);
  let start: number;
  let end: number;
  if (kind === 'day') {
    start = zonedToEpoch(p.year, p.month, p.day, 0, 0, tz);
    end = zonedToEpoch(p.year, p.month, p.day + 1, 0, 0, tz);
  } else if (kind === 'week') {
    const back = (p.weekday + 6) % 7; // Monday start
    start = zonedToEpoch(p.year, p.month, p.day - back, 0, 0, tz);
    end = zonedToEpoch(p.year, p.month, p.day - back + 7, 0, 0, tz);
  } else if (kind === 'month') {
    start = zonedToEpoch(p.year, p.month, 1, 0, 0, tz);
    end = zonedToEpoch(p.year, p.month + 1, 1, 0, 0, tz);
  } else {
    start = zonedToEpoch(p.year, 1, 1, 0, 0, tz);
    end = zonedToEpoch(p.year + 1, 1, 1, 0, 0, tz);
  }
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}
