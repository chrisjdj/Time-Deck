export type ModeId =
  | 'clock'
  | 'world'
  | 'map'
  | 'meeting'
  | 'countdown'
  | 'event'
  | 'stopwatch'
  | 'presenter'
  | 'intervals'
  | 'multi'
  | 'exam'
  | 'wordclock'
  | 'binary'
  | 'progress'
  | 'moon';

export type ThemePref = 'light' | 'dark' | 'system';
export type DisplayStyle = 'minimal' | 'glass' | 'neon' | 'flip' | 'led' | 'aurora' | 'contrast';
export type FontId = 'inter' | 'outfit' | 'grotesk' | 'mono';
export type SoundKind = 'chime' | 'beep' | 'gong' | 'bell';

/** Anchor-based timer state. Elapsed = acc + (running ? now - anchor : 0). */
export interface TimerRun {
  status: 'idle' | 'running' | 'paused';
  anchor: number;
  acc: number;
}

export interface Appearance {
  style: DisplayStyle;
  accent: string;
  font: FontId;
  scale: number; // 0.6 – 1.4
  bg: 'style' | 'solid' | 'gradient' | 'image';
  bgColor: string;
  bgColor2: string;
  bgImageId: string; // IndexedDB key ('' = none)
  showLabels: boolean;
  pixelShift: boolean;
  hour12: boolean;
  touchMode: boolean;
}

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0..1
  kind: SoundKind;
  speech: boolean;
  notify: boolean;
}

export interface ClockSettings {
  face: 'digital' | 'analog';
  showSeconds: boolean;
  showDate: boolean;
  city: string; // '' = local
  showUtc: boolean;
  showIsoWeek: boolean;
  showUnix: boolean;
}

export interface WorldSettings {
  cities: string[];
  showSeconds: boolean;
  showSun: boolean;
  showOffset: boolean;
}

export interface MapSettings {
  cities: string[];
  showLabels: boolean;
}

export interface MeetingSettings {
  cities: string[];
  workStart: number; // hour
  workEnd: number;
  dateOffset: number; // days from today
  selectedHour: number | null; // UTC hour offset within planned day (0..23.5) in base city time
}

export interface CountdownSettings {
  durationMs: number;
  overtime: boolean;
  warnAtSec: number; // yellow threshold
  dangerAtSec: number; // red threshold
  showProgress: boolean;
  showTenths: boolean;
  title: string;
}

export interface EventSettings {
  title: string;
  target: string; // 'YYYY-MM-DDTHH:mm'
  city: string; // '' = local timezone
  countUpAfter: boolean;
}

export interface StopwatchSettings {
  showLaps: boolean;
}

export interface PresenterSegment {
  id: string;
  title: string;
  minutes: number;
}

export interface PresenterSettings {
  segments: PresenterSegment[];
  active: number;
  warnAtSec: number;
  dangerAtSec: number;
  message: string;
  messageFlash: boolean;
  showClock: boolean;
}

export interface IntervalPhase {
  id: string;
  label: string;
  seconds: number;
  kind: 'work' | 'rest' | 'long';
}

export interface IntervalSettings {
  preset: 'pomodoro' | 'custom';
  workMin: number;
  shortMin: number;
  longMin: number;
  rounds: number; // work sessions before a long break
  cycles: number; // how many pomodoro cycles (sets)
  custom: IntervalPhase[];
  repeat: number; // repetitions of custom list
}

export interface MultiTimer {
  id: string;
  label: string;
  color: string;
  kind: 'countdown' | 'stopwatch';
  durationMs: number;
  run: TimerRun;
}

export interface MultiSettings {
  timers: MultiTimer[];
}

export interface ExamSettings {
  title: string;
  kind: 'manual' | 'scheduled';
  durationMin: number;
  readingMin: number;
  start: string; // 'HH:mm' for scheduled
  end: string;
  milestones: number[]; // minutes remaining
  notice: string;
  showClock: boolean;
}

export interface FunSettings {
  binaryLabels: boolean;
  progressBars: Array<'day' | 'week' | 'month' | 'year'>;
  moonCity: string;
}

export interface ModeSettings {
  clock: ClockSettings;
  world: WorldSettings;
  map: MapSettings;
  meeting: MeetingSettings;
  countdown: CountdownSettings;
  event: EventSettings;
  stopwatch: StopwatchSettings;
  presenter: PresenterSettings;
  intervals: IntervalSettings;
  multi: MultiSettings;
  exam: ExamSettings;
  fun: FunSettings;
}

/** Runtime of the single "main" timer used by countdown/stopwatch/presenter/intervals/exam. */
export interface Runtime {
  countdown: TimerRun;
  stopwatch: TimerRun & { laps: number[] };
  presenter: TimerRun;
  intervals: TimerRun;
  exam: TimerRun;
}

export interface DeckConfig {
  v: 1;
  mode: ModeId;
  appearance: Appearance;
  sound: SoundSettings;
  settings: ModeSettings;
  runtime: Runtime;
}

export interface Alarm {
  id: string;
  label: string;
  time: string; // 'HH:mm'
  days: number[]; // 0=Sun..6, empty = once
  enabled: boolean;
  createdAt: number;
}

export interface Reminder {
  id: string;
  label: string;
  at: number; // epoch ms
}

export interface ActiveAlert {
  id: string; // alarm/reminder id + fire key
  label: string;
  firedAt: number;
  sourceId: string;
  source: 'alarm' | 'reminder';
}

export interface Preset {
  id: string;
  name: string;
  savedAt: number;
  config: DeckConfig;
}
