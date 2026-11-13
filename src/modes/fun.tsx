import { CitySelect } from '../components/CityPicker';
import { Label, ProgressBar } from '../components/display';
import { Section, Toggle } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { useLocale, useT } from '../i18n';
import { getCity, localCity } from '../data/cities';
import { fmt, localTz, timeText, zonedParts } from '../lib/tz';
import { WORD_GRID, litWords } from '../lib/wordclock';
import { progressOf, type ProgressKind } from '../lib/progress';
import { moonInfo, moonLitPath } from '../lib/solar';
import SunCalc from '../lib/suncalc';
import { useModeSettings, type DisplayProps } from './common';

// ---------------- Word clock ----------------
export function WordDisplay(_: DisplayProps) {
  void _;
  const now = useNow('second');
  const p = zonedParts(now, localTz());
  const { words, dots, sentence } = litWords(p.hour, p.minute);
  return (
    <div className="m-word" role="timer" aria-label={sentence}>
      <div className="m-word__grid" aria-hidden>
        {WORD_GRID.map((row, r) => (
          <div key={r} className="m-word__row">
            {row.map((l, c) => (
              <span key={c} className={l.word && words.has(l.word) ? 'is-lit' : ''}>
                {l.ch}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="m-word__dots" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={i <= dots ? 'is-lit' : ''} />
        ))}
      </div>
    </div>
  );
}

export function WordSettings() {
  const t = useT();
  return (
    <Section title={t('m.wordclock', 'Word clock')}>
      <p className="muted small">{t('wc.hint', 'Reads the time in words, rounded down to five minutes. The dots add the remaining minutes. English only.')}</p>
    </Section>
  );
}

// ---------------- Binary clock ----------------
export function BinaryDisplay({ config }: DisplayProps) {
  const now = useNow('second');
  const p = zonedParts(now, localTz());
  const h12 = config.appearance.hour12;
  const hour = h12 ? p.hour % 12 || 12 : p.hour;
  const period = h12 ? (p.hour < 12 ? 'AM' : 'PM') : '';
  const digits = [hour, p.minute, p.second].flatMap((v) => [Math.floor(v / 10), v % 10]);
  const maxBits = [h12 ? 1 : 2, 4, 3, 4, 3, 4];
  const labels = config.settings.fun.binaryLabels;
  return (
    <div className="m-binary" role="timer" aria-label={`${hour}:${String(p.minute).padStart(2, '0')}:${String(p.second).padStart(2, '0')} ${period}`.trim()}>
      <div className="m-binary__cols" aria-hidden>
        {digits.map((d, i) => (
          <div key={i} className={'m-binary__col' + (i % 2 === 1 && i < 5 ? ' is-gap' : '')}>
            {[8, 4, 2, 1].map((bit, b) => (
              <span key={bit} className={'bit' + (d & bit ? ' is-on' : '') + (4 - b > maxBits[i] ? ' is-unused' : '')} />
            ))}
            {labels && <span className="m-binary__digit">{d}</span>}
          </div>
        ))}
      </div>
      {labels && (
        <div className="m-binary__legend" aria-hidden>
          <span>8</span>
          <span>4</span>
          <span>2</span>
          <span>1</span>
        </div>
      )}
      {period && (
        <div className="m-binary__period" aria-hidden>
          {period}
        </div>
      )}
    </div>
  );
}

export function BinarySettings() {
  const t = useT();
  const [s, set] = useModeSettings('fun');
  return (
    <Section title={t('m.binary', 'Binary clock')}>
      <Toggle checked={s.binaryLabels} onChange={(v) => set((d) => void (d.binaryLabels = v))} label={t('bin.labels', 'Show decimal digits')} hint={t('bin.hint', 'Each column is one digit of HH:MM:SS, bits 8-4-2-1 from top. Follows the 12h / 24h setting.')} />
    </Section>
  );
}

// ---------------- Progress of day/week/month/year ----------------
type Bar = ProgressKind;

export function ProgressDisplay({ config }: DisplayProps) {
  const t = useT();
  const locale = useLocale();
  const now = useNow('second');
  const tz = localTz();
  const bars = config.settings.fun.progressBars;
  const names: Record<Bar, string> = {
    day: t('pg.day', 'Today'),
    week: t('pg.week', 'This week'),
    month: fmt(locale, { timeZone: tz, month: 'long' }).format(new Date(now)),
    year: String(zonedParts(now, tz).year),
  };
  return (
    <div className="m-progress">
      {bars.map((b) => {
        const v = progressOf(b, now, tz);
        return (
          <div key={b} className="m-progress__row">
            <div className="m-progress__head">
              <span>{names[b]}</span>
              <span className="m-progress__pct">{(v * 100).toFixed(b === 'year' ? 3 : b === 'day' ? 2 : 1)}%</span>
            </div>
            <ProgressBar value={v} />
          </div>
        );
      })}
    </div>
  );
}

export function ProgressSettings() {
  const t = useT();
  const [s, set] = useModeSettings('fun');
  const all: Bar[] = ['day', 'week', 'month', 'year'];
  const label: Record<Bar, string> = { day: t('pg.dayL', 'Day'), week: t('pg.weekL', 'Week'), month: t('pg.monthL', 'Month'), year: t('pg.yearL', 'Year') };
  return (
    <Section title={t('pg.bars', 'Bars')}>
      {all.map((b) => (
        <Toggle
          key={b}
          checked={s.progressBars.includes(b)}
          label={label[b]}
          onChange={(on) =>
            set((d) => {
              d.progressBars = all.filter((x) => (x === b ? on : d.progressBars.includes(x)));
            })
          }
        />
      ))}
    </Section>
  );
}

// ---------------- Moon phase ----------------
export function MoonDisplay({ config }: DisplayProps) {
  const t = useT();
  const locale = useLocale();
  const now = useNow('minute');
  const info = moonInfo(now);
  const city = config.settings.fun.moonCity ? getCity(config.settings.fun.moonCity) : localCity();
  const southern = (city?.lat ?? 0) < 0;
  const tz = city?.tz ?? localTz();
  const h12 = config.appearance.hour12;
  const names: Record<typeof info.name, string> = {
    new: t('moon.new', 'New moon'),
    waxingCrescent: t('moon.waxCres', 'Waxing crescent'),
    firstQuarter: t('moon.firstQ', 'First quarter'),
    waxingGibbous: t('moon.waxGib', 'Waxing gibbous'),
    full: t('moon.full', 'Full moon'),
    waningGibbous: t('moon.wanGib', 'Waning gibbous'),
    lastQuarter: t('moon.lastQ', 'Last quarter'),
    waningCrescent: t('moon.wanCres', 'Waning crescent'),
  };
  const dfmt = (ep: number) => fmt(locale, { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(ep));
  let rise: string | null = null;
  let set: string | null = null;
  if (city?.lat != null && city.lon != null) {
    const mt = SunCalc.getMoonTimes(new Date(now), city.lat, city.lon);
    const f = (d?: Date) => {
      if (!d || !Number.isFinite(d.getTime())) return null;
      const x = timeText(d.getTime(), tz, h12);
      return `${x.hm}${x.period ? ' ' + x.period : ''}`;
    };
    rise = f(mt.rise);
    set = f(mt.set);
  }
  return (
    <div className="m-moon">
      <svg className="m-moon__disc" viewBox="-1.1 -1.1 2.2 2.2" aria-hidden style={southern ? { transform: 'scaleX(-1)' } : undefined}>
        <defs>
          <radialGradient id="tdmoon" cx="0.35" cy="0.35" r="0.9">
            <stop offset="0" stopColor="#fffbe8" />
            <stop offset="1" stopColor="#d9d2b8" />
          </radialGradient>
        </defs>
        <circle r="1" className="m-moon__dark" />
        <path d={moonLitPath(info.phase)} fill="url(#tdmoon)" />
        <circle r="1" className="m-moon__rim" />
      </svg>
      <div className="m-moon__info">
        <div className="d-title">{names[info.name]}</div>
        <Label className="d-sub">
          {t('moon.illum', '{p}% illuminated', { p: Math.round(info.fraction * 100) })} · {t('moon.age', 'day {d} of 29.5', { d: info.ageDays.toFixed(1) })}
        </Label>
        <div className="m-moon__facts">
          <span>
            {t('moon.nextFull', 'Next full')} <b>{dfmt(info.nextFull)}</b>
          </span>
          <span>
            {t('moon.nextNew', 'Next new')} <b>{dfmt(info.nextNew)}</b>
          </span>
          {(rise || set) && (
            <span>
              {rise && (
                <>
                  ↑ <b>{rise}</b>{' '}
                </>
              )}
              {set && (
                <>
                  ↓ <b>{set}</b>
                </>
              )}
              {city && <small> · {city.name}</small>}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function MoonSettings() {
  const t = useT();
  const [s, set] = useModeSettings('fun');
  return (
    <Section title={t('moon.location', 'Location (moonrise / moonset)')}>
      <CitySelect id={s.moonCity} onChange={(id) => set((d) => void (d.moonCity = id))} />
    </Section>
  );
}

