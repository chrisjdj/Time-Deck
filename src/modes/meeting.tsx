import { ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import { CityList, CitySelect } from '../components/CityPicker';
import { Field, NumberInput, Section } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { useLocale, useT } from '../i18n';
import { flag, getCity, localCity, type City } from '../data/cities';
import { fmt, localTz, timeText, utcLabel, zonedParts, zonedToEpoch } from '../lib/tz';
import { daySlots, overlapSlots, ranges, slotKind } from '../lib/meeting';
import { copyText } from '../lib/browser';
import { DAY, pad } from '../lib/time';
import { useDeck } from '../store/deck';
import { useModeSettings, type DisplayProps } from './common';

/** Compact cell label: "18" with a superscript "30" for half-hour zones, "6p" in 12h mode. */
function HourCell({ h, m, h12 }: { h: number; m: number; h12: boolean }) {
  return (
    <span className="mcell__h">
      {h12 ? h % 12 || 12 : h}
      {m > 0 && <sup>{pad(m)}</sup>}
      {h12 && <small>{h < 12 ? 'a' : 'p'}</small>}
    </span>
  );
}

function hourLabel(h: number, m: number, h12: boolean): string {
  if (!h12) return m ? `${h}:${pad(m)}` : `${h}`;
  const hh = h % 12 || 12;
  return `${hh}${m ? ':' + pad(m) : ''}${h < 12 ? 'a' : 'p'}`;
}

export function Display({ config }: DisplayProps) {
  const s = config.settings.meeting;
  const t = useT();
  const locale = useLocale();
  const update = useDeck((st) => st.update);
  const now = useNow('minute');
  const [copied, setCopied] = useState(false);
  const cities = s.cities.map(getCity).filter((c): c is City => !!c);
  const base = cities[0] ?? localCity();
  const h12 = config.appearance.hour12;
  const slots = useMemo(() => daySlots(now, base.tz, s.dateOffset), [now, base.tz, s.dateOffset]);
  const overlap = useMemo(() => overlapSlots(slots, cities.map((c) => c.tz), s.workStart, s.workEnd), [slots, cities, s.workStart, s.workEnd]);
  const overlapSet = new Set(overlap);
  const nowFrac = (now - slots[0]) / DAY;
  const sel = s.selectedHour;
  const dayTitle = fmt(locale, { timeZone: base.tz, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(slots[12]));

  const setSel = (i: number | null) => update((c) => void (c.settings.meeting.selectedHour = i));
  const shiftDay = (d: number) =>
    update((c) => {
      c.settings.meeting.dateOffset = d === 0 ? 0 : c.settings.meeting.dateOffset + d;
      c.settings.meeting.selectedHour = null;
    });

  const summary =
    sel !== null
      ? cities
          .map((c) => {
            const ep = slots[sel];
            const tt = timeText(ep, c.tz, h12);
            const d = fmt(locale, { timeZone: c.tz, weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(ep));
            return `${c.name}: ${d} ${tt.hm}${tt.period ? ' ' + tt.period : ''}`;
          })
          .join('\n')
      : '';

  if (!cities.length) return <div className="d-empty">{t('world.empty', 'Add cities in the settings panel')}</div>;

  return (
    <div className="m-meeting">
      <header className="m-meeting__head">
        <div className="m-meeting__nav">
          <button type="button" className="d-btn" onClick={() => shiftDay(-1)} aria-label={t('mp.prevDay', 'Previous day')}>
            <ChevronLeft size="1em" />
          </button>
          <div className="m-meeting__day">{dayTitle}</div>
          <button type="button" className="d-btn" onClick={() => shiftDay(1)} aria-label={t('mp.nextDay', 'Next day')}>
            <ChevronRight size="1em" />
          </button>
          {s.dateOffset !== 0 && (
            <button type="button" className="d-btn d-btn--text" onClick={() => shiftDay(0)}>
              {t('mp.today', 'Today')}
            </button>
          )}
        </div>
        <div className="m-meeting__legend">
          <span className="lg lg--work" /> {t('mp.work', 'Working hours')}
          <span className="lg lg--edge" /> {t('mp.edge', 'Early / late')}
          <span className="lg lg--night" /> {t('mp.night', 'Night')}
        </div>
      </header>
      <div className="m-meeting__grid" style={{ '--n': cities.length } as CSSProperties}>
        {cities.map((c) => {
          const nowT = timeText(now, c.tz, h12);
          return (
            <div key={c.id} className="mrow">
              <div className="mrow__city">
                <span className="mrow__name">
                  {flag(c.cc)} {c.name}
                </span>
                <span className="mrow__meta">
                  {nowT.hm}
                  {nowT.period && ' ' + nowT.period} · {utcLabel(now, c.tz)}
                </span>
              </div>
              <div className="mrow__cells">
                {slots.map((ep, i) => {
                  const p = zonedParts(ep, c.tz);
                  const kind = slotKind(p.hour, p.minute, p.weekday, s.workStart, s.workEnd);
                  const newDay = p.hour === 0 && p.minute < 60 && i > 0;
                  return (
                    <button
                      type="button"
                      key={i}
                      className={`mcell mcell--${kind}${overlapSet.has(i) ? ' is-overlap' : ''}${sel === i ? ' is-sel' : ''}${p.hour === 0 ? ' is-midnight' : ''}`}
                      onClick={() => setSel(sel === i ? null : i)}
                      aria-label={`${c.name} ${hourLabel(p.hour, p.minute, h12)}`}
                      tabIndex={c === cities[0] ? 0 : -1}
                    >
                      {p.hour === 0 || newDay ? (
                        <span className="mcell__day">{fmt(locale, { timeZone: c.tz, weekday: 'short' }).format(new Date(ep))}</span>
                      ) : (
                        <HourCell h={p.hour} m={p.minute} h12={h12} />
                      )}
                    </button>
                  );
                })}
                {s.dateOffset === 0 && nowFrac >= 0 && nowFrac <= 1 && <span className="mrow__now" style={{ left: `${nowFrac * 100}%` }} aria-hidden />}
              </div>
            </div>
          );
        })}
      </div>
      <footer className="m-meeting__foot">
        {sel !== null ? (
          <div className="m-meeting__sel">
            <span>{summary.split('\n').join('  ·  ')}</span>
            <button
              type="button"
              className="d-btn d-btn--text"
              onClick={async () => {
                setCopied(await copyText(summary));
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              <Copy size="1em" /> {copied ? t('a.copied', 'Copied') : t('a.copy', 'Copy')}
            </button>
          </div>
        ) : (
          <span className="muted">
            {overlap.length
              ? t('mp.overlap', 'Overlap: {ranges}', {
                  ranges: ranges(overlap)
                    .map(([a, b]) => {
                      const x = timeText(slots[a], base.tz, h12);
                      const y = timeText(slots[a] + (b - a) * 3600000, base.tz, h12);
                      return `${x.hm}${x.period}–${y.hm}${y.period}`;
                    })
                    .join(', '),
                }) + ` (${base.name})`
              : t('mp.noOverlap', 'No common working hours on this day')}
            {' · '}
            {t('mp.click', 'Click an hour to select it')}
          </span>
        )}
      </footer>
    </div>
  );
}

function Converter() {
  const t = useT();
  const locale = useLocale();
  const h12 = useDeck((st) => st.config.appearance.hour12);
  const meetingCities = useDeck((st) => st.config.settings.meeting.cities);
  const [src, setSrc] = useState('');
  const today = new Date();
  const [date, setDate] = useState(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
  const [time, setTime] = useState(`${pad(today.getHours())}:00`);
  const srcCity = src ? getCity(src) : null;
  const srcTz = srcCity?.tz ?? localTz();
  const [y, mo, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const ep = y && mo && d ? zonedToEpoch(y, mo, d, hh || 0, mm || 0, srcTz) : NaN;
  const targets = meetingCities.map(getCity).filter((c): c is City => !!c);
  return (
    <>
      <CitySelect id={src} onChange={setSrc} />
      <div className="grid-2">
        <Field label={t('ev.date', 'Date')}>
          <input className="text-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={t('ev.time', 'Time')}>
          <input className="text-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      {Number.isFinite(ep) && (
        <ul className="conv-list">
          {targets.map((c) => {
            const tt = timeText(ep, c.tz, h12);
            return (
              <li key={c.id}>
                <span>
                  {flag(c.cc)} {c.name}
                </span>
                <b>
                  {tt.hm}
                  {tt.period && ' ' + tt.period}
                </b>
                <small>{fmt(locale, { timeZone: c.tz, weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(ep))}</small>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function Settings() {
  const t = useT();
  const [s, set] = useModeSettings('meeting');
  return (
    <>
      <Section title={t('mp.cities', 'Participants’ cities')}>
        <CityList ids={s.cities} onChange={(ids) => set((d) => void (d.cities = ids))} max={8} min={1} />
        <p className="muted small">{t('mp.baseHint', 'The first city is the reference for the timeline.')}</p>
      </Section>
      <Section title={t('mp.work', 'Working hours')}>
        <div className="grid-2">
          <Field label={t('mp.from', 'From')}>
            <NumberInput value={s.workStart} min={0} max={23} onChange={(v) => set((d) => void (d.workStart = Math.min(v, d.workEnd - 1)))} suffix="h" />
          </Field>
          <Field label={t('mp.to', 'To')}>
            <NumberInput value={s.workEnd} min={1} max={24} onChange={(v) => set((d) => void (d.workEnd = Math.max(v, d.workStart + 1)))} suffix="h" />
          </Field>
        </div>
      </Section>
      <Section title={t('mp.converter', 'Time converter')}>
        <Converter />
      </Section>
    </>
  );
}
