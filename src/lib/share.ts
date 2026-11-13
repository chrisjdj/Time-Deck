import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { DeckConfig } from '../types';
import { idleRun } from './time';
import { normalizeConfig } from '../store/defaults';

/** Remove per-device / transient state before sharing. */
export function shareable(config: DeckConfig): DeckConfig {
  const c = structuredClone(config);
  c.runtime = {
    countdown: idleRun(),
    stopwatch: { ...idleRun(), laps: [] },
    presenter: idleRun(),
    intervals: idleRun(),
    exam: idleRun(),
  };
  c.settings.multi.timers = c.settings.multi.timers.map((t) => ({ ...t, run: idleRun() }));
  if (c.appearance.bg === 'image') c.appearance.bg = 'style';
  c.appearance.bgImageId = '';
  return c;
}

export function encodeConfig(config: DeckConfig): string {
  return 'v1.' + compressToEncodedURIComponent(JSON.stringify(shareable(config)));
}

export function decodeConfig(s: string): DeckConfig | null {
  try {
    const body = s.startsWith('v1.') ? s.slice(3) : s;
    const json = decompressFromEncodedURIComponent(body);
    if (!json) return null;
    return normalizeConfig(JSON.parse(json));
  } catch {
    return null;
  }
}

export interface DisplayParams {
  s?: string;
  embed: boolean;
  transparent: boolean;
  scale?: number;
  align?: 'center' | 'left' | 'right' | 'top' | 'bottom';
  color?: string;
}

export function buildDisplayUrl(config: DeckConfig, opts: { embed?: boolean; transparent?: boolean } = {}): string {
  const base = location.href.split('#')[0];
  const q = new URLSearchParams();
  q.set('s', encodeConfig(config));
  if (opts.embed) q.set('embed', '1');
  if (opts.transparent) q.set('bg', 'transparent');
  return `${base}#/display?${q.toString()}`;
}

export function parseDisplayParams(query: string): DisplayParams {
  const q = new URLSearchParams(query);
  const scale = q.get('scale');
  const align = q.get('align');
  return {
    s: q.get('s') ?? undefined,
    embed: q.get('embed') === '1',
    transparent: q.get('bg') === 'transparent',
    scale: scale ? Math.min(3, Math.max(0.2, parseFloat(scale) || 1)) : undefined,
    align: align && ['center', 'left', 'right', 'top', 'bottom'].includes(align) ? (align as DisplayParams['align']) : undefined,
    color: q.get('color') ?? undefined,
  };
}
