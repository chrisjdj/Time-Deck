import type { Alarm, Reminder } from '../types';
import { localTz, zonedParts, zonedToEpoch } from './tz';
import { DAY } from './time';

/** Epoch of the alarm on the calendar day containing `epoch` (in tz). */
export function fireTimeOnDay(alarm: Alarm, epoch: number, tz = localTz()): number {
  const p = zonedParts(epoch, tz);
  const [h, m] = alarm.time.split(':').map(Number);
  return zonedToEpoch(p.year, p.month, p.day, h || 0, m || 0, tz);
}

/** Next time this alarm rings after `from` (exclusive), or null when disabled. */
export function nextFire(alarm: Alarm, from: number, tz = localTz()): number | null {
  if (!alarm.enabled) return null;
  for (let i = 0; i <= 8; i++) {
    const dayEpoch = from + i * DAY;
    const at = fireTimeOnDay(alarm, dayEpoch, tz);
    if (at <= from) continue;
    if (alarm.days.length) {
      const wd = zonedParts(at, tz).weekday;
      if (!alarm.days.includes(wd)) continue;
    } else if (at <= alarm.createdAt) continue;
    return at;
  }
  return null;
}

/** Window after the scheduled time during which a missed alarm still rings (e.g. tab was asleep). */
export const GRACE_MS = 5 * 60 * 1000;

export interface DueAlarm {
  alarm: Alarm;
  key: string;
  at: number;
}

export function dueAlarms(alarms: Alarm[], now: number, fired: Set<string>, tz = localTz()): DueAlarm[] {
  const out: DueAlarm[] = [];
  for (const a of alarms) {
    if (!a.enabled) continue;
    // check today and yesterday (for alarms just before midnight)
    for (const back of [0, DAY]) {
      const at = fireTimeOnDay(a, now - back, tz);
      if (at > now || now - at > GRACE_MS) continue;
      if (a.days.length && !a.days.includes(zonedParts(at, tz).weekday)) continue;
      if (!a.days.length && at <= a.createdAt) continue;
      const p = zonedParts(at, tz);
      const key = `${a.id}:${p.year}-${p.month}-${p.day}`;
      if (!fired.has(key)) out.push({ alarm: a, key, at });
    }
  }
  return out;
}

export function dueReminders(reminders: Reminder[], now: number): Reminder[] {
  return reminders.filter((r) => r.at <= now);
}
