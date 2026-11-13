import { CitySelect } from '../components/CityPicker';
import { Label } from '../components/display';
import { useDeckCtx } from '../components/deckCtx';
import { Field, Section, Toggle } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { useLocale, useT } from '../i18n';
import { getCity, flag } from '../data/cities';
import { fmt, localTz, parseLocalIso } from '../lib/tz';
import { pad, splitMs } from '../lib/time';
import { useModeSettings, type DisplayProps } from './common';

export function Display({ config }: DisplayProps) {
  const s = config.settings.event;
  const t = useT();
  const locale = useLocale();
  const now = useNow('second');
  const { appearance } = useDeckCtx();
  const city = s.city ? getCity(s.city) : null;
  const tz = city?.tz ?? localTz();
  const at = parseLocalIso(s.target, tz);
  if (!at) return <div className="d-empty">{t('ev.pick', 'Pick a date and time in the settings')}</div>;
  const diff = at - now;
  const past = diff <= 0;
  const p = splitMs(past ? -diff : diff);
  const units: Array<[number, string]> = [
    [p.d, t('u.days', 'days')],
    [p.h, t('u.hours', 'hours')],
    [p.m, t('u.minutes', 'minutes')],
    [p.s, t('u.seconds', 'seconds')],
  ];
  const shown = p.d > 0 ? units : units.slice(1);
  const when = fmt(locale, { timeZone: tz, dateStyle: 'full', timeStyle: 'short', hour12: appearance.hour12 }).format(new Date(at));

  return (
    <div className="m-event">
      <div className="d-title">{s.title || t('ev.event', 'Event')}</div>
      {past && !s.countUpAfter ? (
        <div className="m-event__arrived">🎉 {t('ev.here', 'It’s here!')}</div>
      ) : (
        <>
          {past && <Label className="d-status">{t('ev.since', 'Time since')}</Label>}
          <div className="units" role="timer" aria-label={shown.map(([v, l]) => `${v} ${l}`).join(', ')}>
            {shown.map(([v, l], i) => (
              <div key={l} className="units__cell">
                <div className="units__num">{i === 0 ? v : pad(v)}</div>
                <Label className="units__lbl">{l}</Label>
              </div>
            ))}
          </div>
        </>
      )}
      <Label className="d-sub">
        {city && `${flag(city.cc)} `}
        {when}
      </Label>
    </div>
  );
}

export function Settings() {
  const t = useT();
  const [s, set] = useModeSettings('event');
  const presets: Array<[string, () => string]> = [
    [t('ev.newYear', 'New Year'), () => `${new Date().getFullYear() + 1}-01-01T00:00`],
    [t('ev.tomorrow', 'Tomorrow 9:00'), () => {
      const d = new Date(Date.now() + 86400000);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00`;
    }],
    [t('ev.friday', 'Friday 17:00'), () => {
      const d = new Date();
      d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T17:00`;
    }],
  ];
  return (
    <>
      <Section title={t('ev.event', 'Event')}>
        <Field label={t('ev.title', 'Title')}>
          <input className="text-input" value={s.title} maxLength={60} onChange={(e) => set((d) => void (d.title = e.target.value))} />
        </Field>
        <Field label={t('ev.when', 'Date & time')}>
          <input className="text-input" type="datetime-local" value={s.target} onChange={(e) => set((d) => void (d.target = e.target.value))} />
        </Field>
        <div className="chips">
          {presets.map(([label, fn]) => (
            <button
              key={label}
              type="button"
              className="chip"
              onClick={() =>
                set((d) => {
                  d.target = fn();
                  if (label === t('ev.newYear', 'New Year')) d.title = label;
                })
              }
            >
              {label}
            </button>
          ))}
        </div>
      </Section>
      <Section title={t('clock.zone', 'Time zone')}>
        <CitySelect id={s.city} onChange={(id) => set((d) => void (d.city = id))} />
      </Section>
      <Section title={t('o.options', 'Options')}>
        <Toggle checked={s.countUpAfter} onChange={(v) => set((d) => void (d.countUpAfter = v))} label={t('ev.countUp', 'Count up after the event')} />
      </Section>
    </>
  );
}
