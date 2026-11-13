import { HOUR } from './time';
import { zonedParts, zonedToEpoch } from './tz';

export type SlotKind = 'work' | 'edge' | 'night';

export function slotKind(hour: number, minute: number, weekday: number, workStart: number, workEnd: number): SlotKind {
  const h = hour + minute / 60;
  const weekend = weekday === 0 || weekday === 6;
  if (!weekend && h >= workStart && h < workEnd) return 'work';
  if (h >= 7 && h < 22) return 'edge';
  return 'night';
}

/** Start of the given day (offset from today) in base tz, then 24 hourly slots. */
export function daySlots(now: number, baseTz: string, dateOffset: number): number[] {
  const p = zonedParts(now, baseTz);
  const midday = zonedToEpoch(p.year, p.month, p.day, 12, 0, baseTz) + dateOffset * 24 * HOUR;
  const q = zonedParts(midday, baseTz);
  const start = zonedToEpoch(q.year, q.month, q.day, 0, 0, baseTz);
  return Array.from({ length: 24 }, (_, i) => start + i * HOUR);
}

/** Indices of slots where every zone is inside working hours. */
export function overlapSlots(slots: number[], tzs: string[], workStart: number, workEnd: number): number[] {
  return slots
    .map((ep, i) => ({ ep, i }))
    .filter(({ ep }) =>
      tzs.every((tz) => {
        const p = zonedParts(ep, tz);
        return slotKind(p.hour, p.minute, p.weekday, workStart, workEnd) === 'work';
      }),
    )
    .map((x) => x.i);
}

/** Group consecutive indices into [start, endExclusive] ranges. */
export function ranges(idx: number[]): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const i of idx) {
    const last = out.at(-1);
    if (last && last[1] === i) last[1] = i + 1;
    else out.push([i, i + 1]);
  }
  return out;
}
