import { Suspense, useState } from 'react';
import { Bell, ExternalLink, Keyboard, Maximize, Monitor, Moon, Palette, Share2, SlidersHorizontal, Sun, Volume2, Bookmark } from 'lucide-react';
import { useDeck } from '../store/deck';
import { GROUPS, MODES, MODE_MAP } from '../modes';
import { DeckView } from '../components/DeckView';
import { ControlBar } from '../components/ControlBar';
import { HourFormatSwitch, Segmented } from '../components/ui';
import { UI_LANGS, useT } from '../i18n';
import { AppearancePanel } from './AppearancePanel';
import { SoundPanel } from './SoundPanel';
import { PresetsPanel, SharePanel } from './PresetsPanel';
import { AlarmsPanel } from './AlarmsPanel';
import { HelpOverlay } from '../components/HelpOverlay';
import { useHotkeys } from '../hooks/useHotkeys';
import { sync } from '../lib/sync';
import { openDisplayWindow, presentHere } from '../lib/present';
import type { ThemePref } from '../types';

type Tab = 'mode' | 'look' | 'sound' | 'presets' | 'share';

function Logo() {
  return (
    <div className="brand">
      <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden>
        <defs>
          <linearGradient id="lg-brand" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#lg-brand)" />
        <circle cx="16" cy="16" r="8.5" fill="none" stroke="#fff" strokeWidth="2.2" />
        <path d="M16 11v5.2l3.4 2" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className="brand__name">
        Time<span>-Deck</span>
      </span>
    </div>
  );
}

export function Dashboard() {
  const t = useT();
  const config = useDeck((s) => s.config);
  const setMode = useDeck((s) => s.setMode);
  const themePref = useDeck((s) => s.themePref);
  const locale = useDeck((s) => s.locale);
  const patch = useDeck((s) => s.patch);
  const alarms = useDeck((s) => s.alarms);
  const reminders = useDeck((s) => s.reminders);
  const [tab, setTab] = useState<Tab>('mode');
  const [alarmsOpen, setAlarmsOpen] = useState(false);
  const [help, setHelp] = useState(false);
  useHotkeys({ onHelp: () => setHelp(true) });

  const mode = MODE_MAP[config.mode] ?? MODE_MAP.clock;
  const ModeSettings = mode.Settings;
  const activeAlarms = alarms.filter((a) => a.enabled).length + reminders.length;
  const displayOpen = sync.displayAlive();

  const tabs: Array<{ id: Tab; icon: typeof Palette; label: string }> = [
    { id: 'mode', icon: SlidersHorizontal, label: t('tab.mode', 'Settings') },
    { id: 'look', icon: Palette, label: t('tab.look', 'Look') },
    { id: 'sound', icon: Volume2, label: t('tab.sound', 'Sound') },
    { id: 'presets', icon: Bookmark, label: t('tab.presets', 'Presets') },
    { id: 'share', icon: Share2, label: t('tab.share', 'Share') },
  ];

  return (
    <div className="dash">
      <header className="topbar">
        <Logo />
        <div className="topbar__spacer" />
        <select className="select select--sm" value={locale} onChange={(e) => patch({ locale: e.target.value })} aria-label={t('top.lang', 'Language')}>
          <option value="">{t('top.auto', 'Auto language')}</option>
          {UI_LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <Segmented<ThemePref>
          size="sm"
          value={themePref}
          onChange={(v) => patch({ themePref: v })}
          label={t('top.theme', 'Theme')}
          options={[
            { value: 'light', label: <Sun size={16} />, title: t('top.light', 'Light') },
            { value: 'dark', label: <Moon size={16} />, title: t('top.dark', 'Dark') },
            { value: 'system', label: <Monitor size={16} />, title: t('top.system', 'System') },
          ]}
        />
        <button type="button" className="icon-btn has-badge" onClick={() => setAlarmsOpen(true)} aria-label={t('al.title', 'Alarms & reminders')} title={t('al.title', 'Alarms & reminders')}>
          <Bell size={18} />
          {activeAlarms > 0 && <span className="badge">{activeAlarms}</span>}
        </button>
        <button type="button" className="icon-btn hide-sm" onClick={() => setHelp(true)} aria-label={t('k.title', 'Keyboard shortcuts')} title={t('k.title', 'Keyboard shortcuts') + ' (?)'}>
          <Keyboard size={18} />
        </button>
      </header>

      <div className="dash__body">
        <nav className="modes" aria-label={t('nav.modes', 'Modes')}>
          {GROUPS.map((g) => (
            <div key={g.id} className="modes__group">
              <div className="modes__title">{g.label(t)}</div>
              {MODES.filter((m) => m.group === g.id).map((m) => {
                const Icon = m.icon;
                return (
                  <button key={m.id} type="button" className={'mode-btn' + (config.mode === m.id ? ' is-active' : '')} aria-current={config.mode === m.id ? 'page' : undefined} onClick={() => setMode(m.id)}>
                    <Icon size={18} aria-hidden />
                    <span className="mode-btn__text">
                      <span>{m.label(t)}</span>
                      <small>{m.desc(t)}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <main className="stage">
          <div className="stage__head">
            <h1>{mode.label(t)}</h1>
            <div className="stage__actions">
              <button type="button" className="btn" onClick={openDisplayWindow} title={t('st.windowHint', 'Open a second window for a TV or projector. It stays in sync.')}>
                <ExternalLink size={16} /> <span className="hide-sm">{displayOpen ? t('st.windowOpen', 'Display window open') : t('st.window', 'Open display window')}</span>
              </button>
              <button type="button" className="btn btn--primary" onClick={presentHere}>
                <Maximize size={16} /> {t('st.present', 'Present')}
              </button>
            </div>
          </div>
          <div className="preview">
            <div className="preview__frame">
              <DeckView config={config} preview />
            </div>
          </div>
          <ControlBar config={config} />
          <p className="stage__hint muted small">{t('st.hint', 'Tip: press ? for keyboard shortcuts. Everything runs in your browser — nothing is uploaded.')}</p>
        </main>

        <aside className="side" aria-label={t('nav.settings', 'Settings')}>
          <div className="tabs" role="tablist">
            {tabs.map((x) => {
              const Icon = x.icon;
              return (
                <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} className={tab === x.id ? 'is-active' : ''} onClick={() => setTab(x.id)}>
                  <Icon size={16} aria-hidden />
                  <span>{x.label}</span>
                </button>
              );
            })}
          </div>
          <div className="side__body" role="tabpanel">
            {tab === 'mode' && (
              <Suspense fallback={<div className="loading-panel" />}>
                {mode.showsTime && <HourFormatSwitch />}
                <ModeSettings />
              </Suspense>
            )}
            {tab === 'look' && <AppearancePanel />}
            {tab === 'sound' && <SoundPanel />}
            {tab === 'presets' && <PresetsPanel />}
            {tab === 'share' && <SharePanel />}
          </div>
        </aside>
      </div>
      {alarmsOpen && <AlarmsPanel onClose={() => setAlarmsOpen(false)} />}
      {help && <HelpOverlay onClose={() => setHelp(false)} />}
    </div>
  );
}
