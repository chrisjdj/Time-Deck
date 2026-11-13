import SunCalc from './suncalc';

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

export function julianDay(epoch: number): number {
  return epoch / 86400000 + 2440587.5;
}

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const norm180 = (x: number) => {
  const n = norm360(x);
  return n > 180 ? n - 360 : n;
};

/** Point on Earth where the sun is directly overhead (degrees). */
export function subsolarPoint(epoch: number): { lat: number; lon: number } {
  const d = julianDay(epoch) - 2451545.0;
  const g = norm360(357.529 + 0.98560028 * d) * RAD;
  const q = norm360(280.459 + 0.98564736 * d);
  const L = norm360(q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const e = (23.439 - 0.00000036 * d) * RAD;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) * DEG;
  const dec = Math.asin(Math.sin(e) * Math.sin(L)) * DEG;
  const gmst = norm360(280.46061837 + 360.98564736629 * d);
  return { lat: dec, lon: norm180(ra - gmst) };
}

/** Sun altitude (degrees) at a location. */
export function sunAltitude(epoch: number, lat: number, lon: number): number {
  const s = subsolarPoint(epoch);
  const h = (lon - s.lon) * RAD;
  const a = Math.sin(lat * RAD) * Math.sin(s.lat * RAD) + Math.cos(lat * RAD) * Math.cos(s.lat * RAD) * Math.cos(h);
  return Math.asin(Math.max(-1, Math.min(1, a))) * DEG;
}

export function isDaylight(epoch: number, lat: number, lon: number): boolean {
  return sunAltitude(epoch, lat, lon) > -0.833;
}

/**
 * Night-side polygon in lon/lat degrees (equirectangular), closed via the dark pole.
 * Returns [lon, lat] pairs from lon -180 to 180.
 */
export function nightPolygon(epoch: number, step = 2): Array<[number, number]> {
  const s = subsolarPoint(epoch);
  const dec = Math.abs(s.lat) < 0.01 ? 0.01 : s.lat; // avoid tan(0)
  const pts: Array<[number, number]> = [];
  for (let lon = -180; lon <= 180; lon += step) {
    const h = (lon - s.lon) * RAD;
    const lat = Math.atan(-Math.cos(h) / Math.tan(dec * RAD)) * DEG;
    pts.push([lon, lat]);
  }
  const pole = dec > 0 ? -90 : 90;
  pts.push([180, pole], [-180, pole]);
  return pts;
}

/** Twilight band polygons (sun altitude below -6/-12) approximated by offsetting latitudes is inexact; we draw night only. */

export interface SunTimes {
  sunrise: number | null;
  sunset: number | null;
  polar: 'day' | 'night' | null;
}

export function sunTimes(epoch: number, lat: number, lon: number): SunTimes {
  const t = SunCalc.getTimes(new Date(epoch), lat, lon);
  const sr = t.sunrise?.getTime();
  const ss = t.sunset?.getTime();
  if (Number.isFinite(sr) && Number.isFinite(ss)) return { sunrise: sr!, sunset: ss!, polar: null };
  return { sunrise: null, sunset: null, polar: isDaylight(epoch, lat, lon) ? 'day' : 'night' };
}

export interface MoonInfo {
  fraction: number; // illuminated 0..1
  phase: number; // 0 new, .25 first quarter, .5 full, .75 last quarter
  waxing: boolean;
  name: MoonPhaseName;
  ageDays: number;
  nextFull: number;
  nextNew: number;
}

export type MoonPhaseName =
  | 'new'
  | 'waxingCrescent'
  | 'firstQuarter'
  | 'waxingGibbous'
  | 'full'
  | 'waningGibbous'
  | 'lastQuarter'
  | 'waningCrescent';

export const SYNODIC = 29.530588853;

export function moonPhaseName(phase: number): MoonPhaseName {
  const p = ((phase % 1) + 1) % 1;
  if (p < 0.0339 || p >= 0.9661) return 'new';
  if (p < 0.2161) return 'waxingCrescent';
  if (p < 0.2839) return 'firstQuarter';
  if (p < 0.4661) return 'waxingGibbous';
  if (p < 0.5339) return 'full';
  if (p < 0.7161) return 'waningGibbous';
  if (p < 0.7839) return 'lastQuarter';
  return 'waningCrescent';
}

export function moonInfo(epoch: number): MoonInfo {
  const m = SunCalc.getMoonIllumination(new Date(epoch));
  const phase = m.phase;
  const dayMs = 86400000;
  const toFull = ((0.5 - phase + 1) % 1) * SYNODIC * dayMs;
  const toNew = ((1 - phase) % 1 || 1) * SYNODIC * dayMs;
  return {
    fraction: m.fraction,
    phase,
    waxing: phase < 0.5,
    name: moonPhaseName(phase),
    ageDays: phase * SYNODIC,
    nextFull: epoch + toFull,
    nextNew: epoch + toNew,
  };
}

/** SVG path for the lit part of the moon in a unit circle (r=1, centered 0,0). */
export function moonLitPath(phase: number, r = 1): string {
  const p = ((phase % 1) + 1) % 1;
  // terminator ellipse x-radius: cos(2πp) * r ; lit on right while waxing (northern hemisphere)
  const k = Math.cos(2 * Math.PI * p) * r;
  const waxing = p < 0.5;
  const outerSweep = waxing ? 1 : 0;
  // terminator sweep depends on whether the lit part is more or less than half
  const termSweep = waxing ? (k > 0 ? 0 : 1) : k > 0 ? 1 : 0;
  return `M 0 ${-r} A ${r} ${r} 0 0 ${outerSweep} 0 ${r} A ${Math.abs(k)} ${r} 0 0 ${termSweep} 0 ${-r} Z`;
}
