import { create } from 'zustand';
import type { ActiveAlert, Alarm, DeckConfig, ModeId, Preset, Reminder, ThemePref } from '../types';
import { defaultConfig, normalizeConfig } from './defaults';
import { sync } from '../lib/sync';

export interface Persisted {
  config: DeckConfig;
  presets: Preset[];
  alarms: Alarm[];
  reminders: Reminder[];
  alert: ActiveAlert | null;
  firedKeys: string[];
  themePref: ThemePref;
  locale: string; // '' = auto (navigator)
}

export interface DeckState extends Persisted {
  /** Mutate a deep copy of the config. */
  update: (fn: (draft: DeckConfig) => void) => void;
  setMode: (m: ModeId) => void;
  patch: (p: Partial<Persisted>) => void;
  replaceConfig: (c: DeckConfig) => void;
}

const KEY = 'time-deck:v1';
const SYNC_KEYS: Array<keyof Persisted> = ['config', 'presets', 'alarms', 'reminders', 'alert', 'firedKeys', 'themePref', 'locale'];

let isolated = false;
let applyingRemote = false;

function loadPersisted(): Persisted {
  const base: Persisted = {
    config: defaultConfig(),
    presets: [],
    alarms: [],
    reminders: [],
    alert: null,
    firedKeys: [],
    themePref: 'system',
    locale: '',
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const p = JSON.parse(raw) as Partial<Persisted>;
    return {
      config: normalizeConfig(p.config),
      presets: Array.isArray(p.presets) ? p.presets.map((x) => ({ ...x, config: normalizeConfig(x.config) })) : [],
      alarms: Array.isArray(p.alarms) ? p.alarms : [],
      reminders: Array.isArray(p.reminders) ? p.reminders : [],
      alert: p.alert ?? null,
      firedKeys: Array.isArray(p.firedKeys) ? p.firedKeys.slice(-100) : [],
      themePref: p.themePref === 'light' || p.themePref === 'dark' ? p.themePref : 'system',
      locale: typeof p.locale === 'string' ? p.locale : '',
    };
  } catch {
    return base;
  }
}

function pickPersisted(s: DeckState): Persisted {
  const out = {} as Record<string, unknown>;
  for (const k of SYNC_KEYS) out[k] = s[k];
  return out as unknown as Persisted;
}

export const useDeck = create<DeckState>()((set) => ({
  ...loadPersisted(),
  update: (fn) =>
    set((s) => {
      const draft = structuredClone(s.config);
      fn(draft);
      return { config: draft };
    }),
  setMode: (m) => set((s) => ({ config: { ...s.config, mode: m } })),
  patch: (p) => set(p),
  replaceConfig: (c) => set({ config: normalizeConfig(c) }),
}));

let saveTimer: number | undefined;
function scheduleSave() {
  if (isolated) return;
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(pickPersisted(useDeck.getState())));
    } catch {
      /* quota / private mode */
    }
  }, 150);
}

useDeck.subscribe((state, prev) => {
  if (isolated) return;
  const changed = SYNC_KEYS.some((k) => state[k] !== prev[k]);
  if (!changed) return;
  scheduleSave();
  if (!applyingRemote) sync.postState(pickPersisted(state));
});

sync.onState((remote) => {
  if (isolated) return;
  applyingRemote = true;
  try {
    useDeck.setState({ ...(remote as Persisted), config: normalizeConfig((remote as Persisted).config) });
  } finally {
    applyingRemote = false;
  }
});

/** Detach this window from storage + sync and load a config (used for share/embed links). */
export function enterIsolatedMode(config: DeckConfig) {
  isolated = true;
  useDeck.setState({ config: normalizeConfig(config), alert: null });
}

export const isIsolated = () => isolated;

/** Read current state without subscribing. */
export const deck = () => useDeck.getState();
