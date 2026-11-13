import { useDeck } from './deck';
import type { DeckConfig, ModeId, TimerRun } from '../types';
import { elapsed, idleRun, MIN, pauseRun, SEC, shiftRun, startRun, toggleRun } from '../lib/time';
import { buildPhases, locate, phaseStart } from '../lib/sequence';
import { unlockAudio } from '../lib/audio';

const upd = (fn: (c: DeckConfig, now: number) => void) => {
  unlockAudio();
  const now = Date.now();
  useDeck.getState().update((c) => fn(c, now));
};

type MainKey = 'countdown' | 'stopwatch' | 'presenter' | 'intervals' | 'exam';
const MAIN: Partial<Record<ModeId, MainKey>> = {
  countdown: 'countdown',
  stopwatch: 'stopwatch',
  presenter: 'presenter',
  intervals: 'intervals',
  exam: 'exam',
};

export function mainKey(mode: ModeId): MainKey | null {
  return MAIN[mode] ?? null;
}

/** Whether the current mode has start/pause controls. */
export function hasTimer(c: DeckConfig): boolean {
  if (c.mode === 'exam') return c.settings.exam.kind === 'manual';
  return !!MAIN[c.mode] || c.mode === 'multi';
}

function setRun(c: DeckConfig, k: MainKey, run: TimerRun) {
  if (k === 'stopwatch') c.runtime.stopwatch = { ...run, laps: c.runtime.stopwatch.laps };
  else c.runtime[k] = run;
}

export const actions = {
  toggle() {
    upd((c, now) => {
      if (c.mode === 'multi') {
        const anyRunning = c.settings.multi.timers.some((t) => t.run.status === 'running');
        c.settings.multi.timers.forEach((t) => (t.run = anyRunning ? pauseRun(t.run, now) : startRun(t.run, now)));
        return;
      }
      const k = mainKey(c.mode);
      if (!k) return;
      if (k === 'exam' && c.settings.exam.kind !== 'manual') return;
      const run = c.runtime[k];
      // finished countdown without overtime: restart
      if (k === 'countdown' && run.status === 'running' && !c.settings.countdown.overtime && elapsed(run, now) >= c.settings.countdown.durationMs) {
        setRun(c, k, startRun(idleRun(), now));
        return;
      }
      if (k === 'intervals') {
        const pos = locate(buildPhases(c.settings.intervals), elapsed(run, now));
        if (pos.done) {
          setRun(c, k, startRun(idleRun(), now));
          return;
        }
      }
      setRun(c, k, toggleRun(run, now));
    });
  },
  reset() {
    upd((c) => {
      if (c.mode === 'multi') {
        c.settings.multi.timers.forEach((t) => (t.run = idleRun()));
        return;
      }
      const k = mainKey(c.mode);
      if (!k) return;
      if (k === 'stopwatch') c.runtime.stopwatch = { ...idleRun(), laps: [] };
      else c.runtime[k] = idleRun();
    });
  },
  lap() {
    upd((c, now) => {
      if (c.mode !== 'stopwatch') return;
      const sw = c.runtime.stopwatch;
      if (sw.status !== 'running') return;
      sw.laps = [...sw.laps, elapsed(sw, now)];
    });
  },
  /** +/- minutes on the active timer. */
  adjust(minutes: number) {
    upd((c, now) => {
      const delta = minutes * MIN;
      switch (c.mode) {
        case 'countdown':
          c.settings.countdown.durationMs = Math.max(SEC, c.settings.countdown.durationMs + delta);
          break;
        case 'presenter':
        case 'exam':
          // more time = less elapsed
          c.runtime[c.mode] = shiftRun(c.runtime[c.mode], -delta, now);
          break;
        case 'intervals':
          c.runtime.intervals = shiftRun(c.runtime.intervals, -delta, now);
          break;
      }
    });
  },
  next() {
    upd((c, now) => {
      if (c.mode === 'presenter') {
        const p = c.settings.presenter;
        if (p.active >= p.segments.length - 1) return;
        const wasRunning = c.runtime.presenter.status === 'running';
        p.active += 1;
        c.runtime.presenter = wasRunning ? startRun(idleRun(), now) : idleRun();
      } else if (c.mode === 'intervals') {
        const phases = buildPhases(c.settings.intervals);
        const run = c.runtime.intervals;
        const pos = locate(phases, elapsed(run, now));
        const target = phaseStart(phases, pos.index + 1);
        c.runtime.intervals = shiftRun(run.status === 'idle' ? { ...run, status: 'paused' } : run, target - elapsed(run, now), now);
      }
    });
  },
  prev() {
    upd((c, now) => {
      if (c.mode === 'presenter') {
        const p = c.settings.presenter;
        if (p.active <= 0) return;
        const wasRunning = c.runtime.presenter.status === 'running';
        p.active -= 1;
        c.runtime.presenter = wasRunning ? startRun(idleRun(), now) : idleRun();
      } else if (c.mode === 'intervals') {
        const phases = buildPhases(c.settings.intervals);
        const run = c.runtime.intervals;
        const pos = locate(phases, elapsed(run, now));
        const i = pos.phaseElapsed > 3 * SEC || pos.done ? Math.min(pos.index, phases.length - 1) : pos.index - 1;
        const target = phaseStart(phases, Math.max(0, i));
        c.runtime.intervals = shiftRun(run, target - elapsed(run, now), now);
      }
    });
  },
  setCountdown(ms: number, start = false) {
    upd((c, now) => {
      c.settings.countdown.durationMs = Math.max(SEC, ms);
      c.runtime.countdown = start ? startRun(idleRun(), now) : idleRun();
    });
  },
  multiToggle(id: string) {
    upd((c, now) => {
      const t = c.settings.multi.timers.find((x) => x.id === id);
      if (!t) return;
      if (t.kind === 'countdown' && t.run.status === 'running' && elapsed(t.run, now) >= t.durationMs) t.run = idleRun();
      else t.run = toggleRun(t.run, now);
    });
  },
  multiReset(id: string) {
    upd((c) => {
      const t = c.settings.multi.timers.find((x) => x.id === id);
      if (t) t.run = idleRun();
    });
  },
};
