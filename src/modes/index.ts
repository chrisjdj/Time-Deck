import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import {
  AlarmClock,
  Binary,
  CalendarClock,
  Clock,
  Globe2,
  GraduationCap,
  Grid2x2,
  Hourglass,
  Map as MapIcon,
  Mic,
  MoonStar,
  Repeat,
  Timer,
  Type,
  Users,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import type { ModeId } from '../types';
import type { DisplayProps } from './common';
import type { TFn } from '../i18n';

export interface ModeDef {
  id: ModeId;
  group: 'clocks' | 'timers' | 'fun';
  icon: LucideIcon;
  label: (t: TFn) => string;
  desc: (t: TFn) => string;
  Display: LazyExoticComponent<ComponentType<DisplayProps>>;
  Settings: LazyExoticComponent<ComponentType>;
  /** Shows a wall-clock time, so the 12h/24h switch applies. */
  showsTime?: boolean;
}

type Loader = () => Promise<Record<string, unknown>>;
const pick = (load: Loader, name: string) =>
  lazy(async () => ({ default: (await load())[name] as ComponentType<DisplayProps> }));
const pickS = (load: Loader, name: string) => lazy(async () => ({ default: (await load())[name] as ComponentType })) as LazyExoticComponent<ComponentType>;

const L = {
  clock: () => import('./clock'),
  world: () => import('./world'),
  map: () => import('./map'),
  meeting: () => import('./meeting'),
  countdown: () => import('./countdown'),
  event: () => import('./event'),
  stopwatch: () => import('./stopwatch'),
  presenter: () => import('./presenter'),
  intervals: () => import('./intervals'),
  multi: () => import('./multi'),
  exam: () => import('./exam'),
  fun: () => import('./fun'),
} satisfies Record<string, Loader>;

const std = (id: Exclude<ModeId, 'wordclock' | 'binary' | 'progress' | 'moon'>) => ({
  Display: pick(L[id], 'Display'),
  Settings: pickS(L[id], 'Settings'),
});

export const MODES: ModeDef[] = [
  { id: 'clock', group: 'clocks', icon: Clock, label: (t) => t('m.clock', 'Clock'), desc: (t) => t('md.clock', 'Current time, digital or analog'), ...std('clock'), showsTime: true },
  { id: 'world', group: 'clocks', icon: Globe2, label: (t) => t('m.world', 'World clocks'), desc: (t) => t('md.world', 'Several cities side by side'), ...std('world'), showsTime: true },
  { id: 'map', group: 'clocks', icon: MapIcon, label: (t) => t('m.map', 'World map'), desc: (t) => t('md.map', 'Live day / night map'), ...std('map'), showsTime: true },
  { id: 'meeting', group: 'clocks', icon: Users, label: (t) => t('m.meeting', 'Meeting planner'), desc: (t) => t('md.meeting', 'Find overlapping work hours'), ...std('meeting'), showsTime: true },
  { id: 'countdown', group: 'timers', icon: Hourglass, label: (t) => t('m.countdown', 'Countdown'), desc: (t) => t('md.countdown', 'Count down a duration'), ...std('countdown') },
  { id: 'event', group: 'timers', icon: CalendarClock, label: (t) => t('m.event', 'Event countdown'), desc: (t) => t('md.event', 'Days until a date'), ...std('event'), showsTime: true },
  { id: 'stopwatch', group: 'timers', icon: Timer, label: (t) => t('m.stopwatch', 'Stopwatch'), desc: (t) => t('md.stopwatch', 'With laps and splits'), ...std('stopwatch') },
  { id: 'presenter', group: 'timers', icon: Mic, label: (t) => t('m.presenter', 'Presenter'), desc: (t) => t('md.presenter', 'Stage timer with messages'), ...std('presenter'), showsTime: true },
  { id: 'intervals', group: 'timers', icon: Repeat, label: (t) => t('m.intervals', 'Pomodoro / intervals'), desc: (t) => t('md.intervals', 'Work and break cycles'), ...std('intervals') },
  { id: 'multi', group: 'timers', icon: Grid2x2, label: (t) => t('m.multi', 'Multi-timer'), desc: (t) => t('md.multi', 'Many timers on one screen'), ...std('multi') },
  { id: 'exam', group: 'timers', icon: GraduationCap, label: (t) => t('m.exam', 'Exam / classroom'), desc: (t) => t('md.exam', 'Time left with notices'), ...std('exam'), showsTime: true },
  { id: 'wordclock', group: 'fun', icon: Type, label: (t) => t('m.wordclock', 'Word clock'), desc: (t) => t('md.wordclock', 'Time spelled in words'), Display: pick(L.fun, 'WordDisplay'), Settings: pickS(L.fun, 'WordSettings') },
  { id: 'binary', group: 'fun', icon: Binary, label: (t) => t('m.binary', 'Binary clock'), desc: (t) => t('md.binary', 'BCD lights'), Display: pick(L.fun, 'BinaryDisplay'), Settings: pickS(L.fun, 'BinarySettings'), showsTime: true },
  { id: 'progress', group: 'fun', icon: BarChart3, label: (t) => t('m.progress', 'Progress'), desc: (t) => t('md.progress', 'Day, week, month, year'), Display: pick(L.fun, 'ProgressDisplay'), Settings: pickS(L.fun, 'ProgressSettings') },
  { id: 'moon', group: 'fun', icon: MoonStar, label: (t) => t('m.moon', 'Moon phase'), desc: (t) => t('md.moon', 'Phase, rise and set'), Display: pick(L.fun, 'MoonDisplay'), Settings: pickS(L.fun, 'MoonSettings'), showsTime: true },
];

export const MODE_MAP = Object.fromEntries(MODES.map((m) => [m.id, m])) as Record<ModeId, ModeDef>;

export const GROUPS: Array<{ id: ModeDef['group']; label: (t: TFn) => string }> = [
  { id: 'clocks', label: (t) => t('g.clocks', 'Clocks') },
  { id: 'timers', label: (t) => t('g.timers', 'Timers') },
  { id: 'fun', label: (t) => t('g.fun', 'Fun') },
];

export const AlarmIcon = AlarmClock;

/** Preload all mode chunks (so they are cached for offline use and switching is instant). */
export function preloadModes() {
  Object.values(L).forEach((l) => void l().catch(() => {}));
}
