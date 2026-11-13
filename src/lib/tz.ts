import { MIN } from './time';

export const localTz = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  second: number;
  weekday: number; // 0=Sun
}

const partsCache = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(tz: string): Intl.DateTimeFormat {
  let f = partsCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      weekday: 'short',
    });
    partsCache.set(tz, f);
  }
  return f;
}

const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function zonedParts(epoch: number, tz: string): ZonedParts {
  const out: Record<string, string> = {};
  for (const p of partsFormatter(tz).formatToParts(new Date(epoch))) out[p.type] = p.value;
  return {
    year: +out.year,
    month: +out.month,
    day: +out.day,
    hour: +out.hour % 24,
    minute: +out.minute,
    second: +out.second,
    weekday: WD[out.weekday] ?? 0,
  };
}

/** Offset of tz from UTC in minutes at the given instant (e.g. +330 for Asia/Kolkata). */
export function offsetMinutes(epoch: number, tz: string): number {
  const p = zonedParts(epoch, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const floored = Math.floor(epoch / 1000) * 1000;
  return Math.round((asUtc - floored) / MIN);
}

/** Convert a wall-clock time in tz to an epoch. Handles DST (gaps resolve forward). */
export function zonedToEpoch(y: number, mo: number, d: number, h: number, mi: number, tz: string): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let epoch = guess - offsetMinutes(guess, tz) * MIN;
  const off2 = offsetMinutes(epoch, tz);
  epoch = guess - off2 * MIN;
  return epoch;
}

/** Parse 'YYYY-MM-DDTHH:mm' interpreted in tz. */
export function parseLocalIso(iso: string, tz: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return null;
  return zonedToEpoch(+m[1], +m[2], +m[3], +m[4], +m[5], tz);
}

/** Calendar-day difference of tz's date vs base tz's date at the same instant (-1, 0, +1). */
export function dayShift(epoch: number, tz: string, baseTz: string): number {
  const a = zonedParts(epoch, tz);
  const b = zonedParts(epoch, baseTz);
  const da = Date.UTC(a.year, a.month - 1, a.day);
  const db = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((da - db) / 86400000);
}

export function formatOffset(minutes: number, withPlus = true): string {
  const sign = minutes < 0 ? '-' : withPlus ? '+' : '';
  const a = Math.abs(minutes);
  const h = Math.floor(a / 60);
  const m = a % 60;
  return `${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`;
}

/** "UTC+5:30" */
export function utcLabel(epoch: number, tz: string): string {
  const o = offsetMinutes(epoch, tz);
  return o === 0 ? 'UTC' : `UTC${formatOffset(o)}`;
}

/** Relative difference "+5:30h" between tz and base at instant. */
export function relativeOffset(epoch: number, tz: string, baseTz: string): number {
  return offsetMinutes(epoch, tz) - offsetMinutes(epoch, baseTz);
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
export function fmt(locale: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = locale + JSON.stringify(opts);
  let f = fmtCache.get(key);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat(locale, opts);
    } catch {
      f = new Intl.DateTimeFormat('en', opts);
    }
    fmtCache.set(key, f);
  }
  return f;
}

export interface TimeText {
  hm: string; // "10:42"
  sec: string; // "07"
  period: string; // "PM" or ''
}

export function timeText(epoch: number, tz: string, hour12: boolean): TimeText {
  const p = zonedParts(epoch, tz);
  let h = p.hour;
  let period = '';
  if (hour12) {
    period = h < 12 ? 'AM' : 'PM';
    h = h % 12 || 12;
  }
  return {
    hm: `${hour12 ? h : String(h).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`,
    sec: String(p.second).padStart(2, '0'),
    period,
  };
}

export function dateText(epoch: number, tz: string, locale: string, style: 'long' | 'short' = 'long'): string {
  return fmt(
    locale,
    style === 'long'
      ? { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      : { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' },
  ).format(new Date(epoch));
}

/** ISO-8601 week number of the date in tz. */
export function isoWeek(epoch: number, tz: string): number {
  const p = zonedParts(epoch, tz);
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
}

export function allTimeZones(): string[] {
  try {
    const fn = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    if (fn) return fn('timeZone');
  } catch {
    /* ignore */
  }
  return ['UTC'];
}

export function isValidTz(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
