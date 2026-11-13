import { BellPlus, Info, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { HourFormatSwitch, Section, Toggle } from '../components/ui';
import { useLocale, useT } from '../i18n';
import { useDeck } from '../store/deck';
import { nextFire } from '../lib/alarms';
import { formatCountdown, MIN, parseDuration, uid } from '../lib/time';
import { fmt } from '../lib/tz';
import { useNow } from '../hooks/useNow';
import { requestNotifyPermission, unlockAudio } from '../lib/audio';
import type { Alarm } from '../types';

export function AlarmsPanel({ onClose }: { onClose: () => void }) {
  const t = useT();
  const locale = useLocale();
  const alarms = useDeck((s) => s.alarms);
  const reminders = useDeck((s) => s.reminders);
  const patch = useDeck((s) => s.patch);
  const hour12 = useDeck((s) => s.config.appearance.hour12);
  const now = useNow('second');
  const [rLabel, setRLabel] = useState('');
  const [rCustom, setRCustom] = useState('');

  const setAlarm = (id: string, fn: (a: Alarm) => Alarm) => patch({ alarms: alarms.map((a) => (a.id === id ? fn(a) : a)) });
  const addAlarm = () => {
    unlockAudio();
    void requestNotifyPermission();
    const d = new Date(Date.now() + 60 * MIN);
    const time = `${String(d.getHours()).padStart(2, '0')}:00`;
    patch({ alarms: [...alarms, { id: uid(), label: '', time, days: [], enabled: true, createdAt: Date.now() }] });
  };
  const remind = (ms: number) => {
    unlockAudio();
    void requestNotifyPermission();
    patch({ reminders: [...reminders, { id: uid(), label: rLabel.trim() || t('al.reminder', 'Reminder'), at: Date.now() + ms }] });
    setRLabel('');
  };
  const dayNames = Array.from({ length: 7 }, (_, i) => fmt(locale, { weekday: 'narrow', timeZone: 'UTC' }).format(new Date(Date.UTC(2023, 0, 1 + i))));
  const fmtWhen = (ep: number) => fmt(locale, { weekday: 'short', hour: 'numeric', minute: '2-digit', hour12 }).format(new Date(ep));

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="alarms-title" onClick={(e) => e.stopPropagation()}>
        <header className="drawer__head">
          <h2 id="alarms-title">{t('al.title', 'Alarms & reminders')}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('a.close', 'Close')}>
            <X size={18} />
          </button>
        </header>
        <div className="drawer__body">
          <p className="info-note small">
            <Info size={14} /> {t('al.note', 'Alarms ring only while a Time-Deck tab is open (there is no server). Keep this tab or the display open.')}
          </p>
          <HourFormatSwitch />
          <Section title={t('al.remind', 'Remind me in…')}>
            <input className="text-input" value={rLabel} maxLength={60} placeholder={t('al.what', 'What for? (optional)')} onChange={(e) => setRLabel(e.target.value)} />
            <div className="chips">
              {[5, 10, 15, 30, 45, 60].map((m) => (
                <button key={m} type="button" className="chip" onClick={() => remind(m * MIN)}>
                  {m < 60 ? `${m} min` : '1 h'}
                </button>
              ))}
            </div>
            <div className="input-row">
              <input className="text-input" value={rCustom} placeholder={t('al.custom', 'Custom, e.g. 1h 20m')} onChange={(e) => setRCustom(e.target.value)} />
              <button
                type="button"
                className="btn"
                disabled={!parseDuration(rCustom)}
                onClick={() => {
                  const ms = parseDuration(rCustom);
                  if (ms) remind(ms);
                  setRCustom('');
                }}
              >
                <BellPlus size={16} /> {t('a.add', 'Add')}
              </button>
            </div>
            {reminders.length > 0 && (
              <ul className="reminder-list">
                {[...reminders]
                  .sort((a, b) => a.at - b.at)
                  .map((r) => (
                    <li key={r.id}>
                      <span>{r.label}</span>
                      <b className="mono">{formatCountdown(r.at - now)}</b>
                      <button type="button" className="mini-btn" aria-label={t('a.remove', 'Remove')} onClick={() => patch({ reminders: reminders.filter((x) => x.id !== r.id) })}>
                        <X size={14} />
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </Section>
          <Section
            title={t('al.alarms', 'Alarms')}
            actions={
              <button type="button" className="btn btn--ghost btn--sm" onClick={addAlarm}>
                <Plus size={14} /> {t('a.add', 'Add')}
              </button>
            }
          >
            {alarms.length === 0 && <p className="muted small">{t('al.none', 'No alarms yet.')}</p>}
            <ul className="alarm-list">
              {alarms.map((a) => {
                const nf = nextFire(a, now);
                return (
                  <li key={a.id} className={a.enabled ? '' : 'is-off'}>
                    <div className="alarm-list__top">
                      <input type="time" className="text-input alarm-list__time" value={a.time} onChange={(e) => setAlarm(a.id, (x) => ({ ...x, time: e.target.value, enabled: true, createdAt: Date.now() }))} aria-label={t('ev.time', 'Time')} />
                      <Toggle checked={a.enabled} onChange={(v) => setAlarm(a.id, (x) => ({ ...x, enabled: v, createdAt: v ? Date.now() : x.createdAt }))} label={<span className="sr-only">{t('al.enabled', 'Enabled')}</span>} />
                      <button type="button" className="mini-btn" aria-label={t('a.remove', 'Remove')} onClick={() => patch({ alarms: alarms.filter((x) => x.id !== a.id) })}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input className="text-input" value={a.label} maxLength={60} placeholder={t('al.label', 'Label')} onChange={(e) => setAlarm(a.id, (x) => ({ ...x, label: e.target.value }))} />
                    <div className="day-chips" role="group" aria-label={t('al.repeat', 'Repeat on')}>
                      {dayNames.map((dn, i) => (
                        <button
                          key={i}
                          type="button"
                          aria-pressed={a.days.includes(i)}
                          className={'day-chip' + (a.days.includes(i) ? ' is-active' : '')}
                          onClick={() => setAlarm(a.id, (x) => ({ ...x, days: x.days.includes(i) ? x.days.filter((d) => d !== i) : [...x.days, i].sort() }))}
                        >
                          {dn}
                        </button>
                      ))}
                    </div>
                    <small className="muted">
                      {a.days.length === 0 ? t('al.once', 'Once') : a.days.length === 7 ? t('al.daily', 'Every day') : ''}
                      {nf ? ` · ${t('al.next', 'Next')}: ${fmtWhen(nf)} (${formatCountdown(nf - now)})` : ` · ${t('al.off', 'Off')}`}
                    </small>
                  </li>
                );
              })}
            </ul>
          </Section>
        </div>
      </aside>
    </div>
  );
}
