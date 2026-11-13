import { describe, expect, it } from 'vitest';
import { dayShift, formatOffset, isoWeek, offsetMinutes, parseLocalIso, relativeOffset, timeText, zonedParts, zonedToEpoch } from '../src/lib/tz';
import { daySlots, overlapSlots, ranges } from '../src/lib/meeting';
import { getCity, searchCities, flag } from '../src/data/cities';

const utc = (s: string) => Date.parse(s);

describe('time zone offsets', () => {
  it('handles half and quarter hour zones', () => {
    const t = utc('2026-11-13T12:00:00Z');
    expect(offsetMinutes(t, 'Asia/Kolkata')).toBe(330);
    expect(offsetMinutes(t, 'Asia/Kathmandu')).toBe(345);
    expect(offsetMinutes(t, 'America/St_Johns')).toBe(-210);
    expect(offsetMinutes(t, 'UTC')).toBe(0);
  });

  it('follows DST in New York (March and November)', () => {
    expect(offsetMinutes(utc('2026-03-08T06:00:00Z'), 'America/New_York')).toBe(-300); // before 2am local switch
    expect(offsetMinutes(utc('2026-03-08T08:00:00Z'), 'America/New_York')).toBe(-240); // after
    expect(offsetMinutes(utc('2026-11-01T05:30:00Z'), 'America/New_York')).toBe(-240); // 1:30 EDT
    expect(offsetMinutes(utc('2026-11-01T06:30:00Z'), 'America/New_York')).toBe(-300); // 1:30 EST
  });

  it('converts wall time to epoch and back', () => {
    const ep = zonedToEpoch(2026, 7, 1, 9, 30, 'Europe/London');
    expect(new Date(ep).toISOString()).toBe('2026-07-01T08:30:00.000Z');
    const p = zonedParts(ep, 'Asia/Tokyo');
    expect([p.hour, p.minute]).toEqual([17, 30]);
    expect(parseLocalIso('2027-01-01T00:00', 'Pacific/Auckland')).toBe(utc('2026-12-31T11:00:00Z'));
  });

  it('resolves wall times inside a DST gap forward', () => {
    // 2:30 does not exist in New York on 2026-03-08
    const ep = zonedToEpoch(2026, 3, 8, 2, 30, 'America/New_York');
    const p = zonedParts(ep, 'America/New_York');
    expect(p.hour === 3 || p.hour === 1).toBe(true);
  });

  it('labels day shifts and relative offsets', () => {
    const t = utc('2026-11-13T20:00:00Z');
    expect(dayShift(t, 'Asia/Tokyo', 'Europe/London')).toBe(1);
    expect(dayShift(t, 'America/Los_Angeles', 'Asia/Tokyo')).toBe(-1);
    expect(relativeOffset(t, 'Asia/Kolkata', 'Europe/London')).toBe(330);
    expect(formatOffset(330)).toBe('+5:30');
    expect(formatOffset(-210)).toBe('-3:30');
    expect(formatOffset(0)).toBe('+0');
  });

  it('formats 12/24 hour text', () => {
    const t = utc('2026-11-13T15:05:09Z');
    expect(timeText(t, 'UTC', false)).toEqual({ hm: '15:05', sec: '09', period: '' });
    expect(timeText(t, 'UTC', true)).toEqual({ hm: '3:05', sec: '09', period: 'PM' });
    expect(timeText(utc('2026-11-13T00:10:00Z'), 'UTC', true).hm).toBe('12:10');
  });

  it('computes ISO week numbers', () => {
    expect(isoWeek(utc('2026-01-01T12:00:00Z'), 'UTC')).toBe(1);
    expect(isoWeek(utc('2027-01-01T12:00:00Z'), 'UTC')).toBe(53);
    expect(isoWeek(utc('2026-11-13T12:00:00Z'), 'UTC')).toBe(46);
  });
});

describe('meeting planner', () => {
  it('London 15:00 is Tokyo 00:00 next day in November (no DST in Japan)', () => {
    const ep = zonedToEpoch(2026, 11, 13, 15, 0, 'Europe/London');
    const p = zonedParts(ep, 'Asia/Tokyo');
    expect([p.day, p.hour]).toEqual([14, 0]);
  });

  it('finds overlapping work hours between London and New York', () => {
    const now = utc('2026-11-11T12:00:00Z'); // Wednesday
    const slots = daySlots(now, 'Europe/London', 0);
    expect(slots).toHaveLength(24);
    const ov = overlapSlots(slots, ['Europe/London', 'America/New_York'], 9, 18);
    // London 14:00-17:59 = NY 09:00-12:59
    expect(ranges(ov)).toEqual([[14, 18]]);
  });

  it('reports no overlap between Los Angeles and Kolkata with 9-17 hours', () => {
    const now = utc('2026-11-11T12:00:00Z');
    const slots = daySlots(now, 'America/Los_Angeles', 0);
    expect(overlapSlots(slots, ['America/Los_Angeles', 'Asia/Kolkata'], 9, 17)).toEqual([]);
  });

  it('skips weekends', () => {
    const sat = utc('2026-11-14T12:00:00Z');
    expect(overlapSlots(daySlots(sat, 'UTC', 0), ['UTC'], 9, 17)).toEqual([]);
  });
});

describe('cities', () => {
  it('searches by name, country and zone', () => {
    expect(searchCities('tok', 'en')[0].name).toBe('Tokyo');
    expect(searchCities('india', 'en').some((c) => c.tz === 'Asia/Kolkata')).toBe(true);
    expect(searchCities('kirit', 'en')[0].tz).toBe('Pacific/Kiritimati');
  });
  it('resolves raw IANA ids', () => {
    const c = getCity('tz:America/Argentina/Cordoba');
    expect(c?.name).toBe('Cordoba');
    expect(c?.tz).toBe('America/Argentina/Cordoba');
  });
  it('builds flag emoji', () => {
    expect(flag('IN')).toBe('🇮🇳');
    expect(flag('')).toBe('🌐');
  });
});
