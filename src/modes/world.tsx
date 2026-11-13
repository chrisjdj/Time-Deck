import { Moon, Sun, Sunrise, Sunset } from 'lucide-react';
import { CityList } from '../components/CityPicker';
import { Section, Toggle } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { useLocale, useT } from '../i18n';
import { countryName, flag, getCity } from '../data/cities';
import { dateText, dayShift, formatOffset, localTz, relativeOffset, timeText } from '../lib/tz';
import { isDaylight, sunTimes } from '../lib/solar';
import { gridFor, useModeSettings, type DisplayProps } from './common';
import type { CSSProperties } from 'react';
import type { SunTimes } from '../lib/solar';

// Sunrise/sunset only change slowly: cache per city per hour.
const sunCache = new Map<string, SunTimes | null>();
function cachedSun(id: string, lat: number | null, lon: number | null, now: number): SunTimes | null {
  if (lat === null || lon === null) return null;
  const key = `${id}:${Math.floor(now / 3600000)}`;
  if (!sunCache.has(key)) {
    if (sunCache.size > 200) sunCache.clear();
    sunCache.set(key, sunTimes(now, lat, lon));
  }
  return sunCache.get(key) ?? null;
}

export function Display({ config }: DisplayProps) {
  const s = config.settings.world;
  const t = useT();
  const locale = useLocale();
  const now = useNow('second');
  const base = localTz();
  const cities = s.cities.map(getCity).filter((c): c is NonNullable<typeof c> => !!c);
  const { cols, rows } = gridFor(cities.length);
  const sun = cities.map((c) => cachedSun(c.id, c.lat, c.lon, now));

  if (!cities.length) return <div className="d-empty">{t('world.empty', 'Add cities in the settings panel')}</div>;

  return (
    <div className="m-world" style={{ '--cols': cols, '--rows': rows } as CSSProperties} data-count={cities.length}>
      {cities.map((c, i) => {
        const tt = timeText(now, c.tz, config.appearance.hour12);
        const shift = dayShift(now, c.tz, base);
        const rel = relativeOffset(now, c.tz, base);
        const day = c.lat !== null && c.lon !== null ? isDaylight(now, c.lat, c.lon) : null;
        const st = sun[i];
        const fmtT = (ep: number) => timeText(ep, c.tz, config.appearance.hour12);
        return (
          <article key={c.id} className={'tile' + (day === false ? ' is-night' : day ? ' is-day' : '')}>
            <header className="tile__head">
              <span className="tile__flag" aria-hidden>
                {flag(c.cc)}
              </span>
              <span className="tile__name">
                {c.name}
                {config.appearance.showLabels && c.cc && <small>{countryName(c.cc, locale)}</small>}
              </span>
              {day !== null && <span className="tile__dn">{day ? <Sun size="1em" /> : <Moon size="1em" />}</span>}
            </header>
            <div className="tile__time" role="timer" aria-label={`${c.name} ${tt.hm} ${tt.period}`}>
              <span>{tt.hm}</span>
              {s.showSeconds && <span className="tile__sec">:{tt.sec}</span>}
              {tt.period && <span className="tile__period">{tt.period}</span>}
            </div>
            <footer className="tile__foot">
              <span>{dateText(now, c.tz, locale, 'short')}</span>
              {s.showOffset && (
                <span className="tile__badge">
                  {rel === 0 ? t('world.same', 'Same time') : `${formatOffset(rel)}h`}
                  {shift !== 0 && ` · ${shift > 0 ? t('world.tomorrow', 'Tomorrow') : t('world.yesterday', 'Yesterday')}`}
                </span>
              )}
            </footer>
            {s.showSun && st && (
              <div className="tile__sun">
                {st.sunrise && st.sunset ? (
                  <>
                    <span>
                      <Sunrise size="1em" aria-label={t('world.sunrise', 'Sunrise')} /> {fmtT(st.sunrise).hm}
                      {fmtT(st.sunrise).period && ' ' + fmtT(st.sunrise).period}
                    </span>
                    <span>
                      <Sunset size="1em" aria-label={t('world.sunset', 'Sunset')} /> {fmtT(st.sunset).hm}
                      {fmtT(st.sunset).period && ' ' + fmtT(st.sunset).period}
                    </span>
                  </>
                ) : (
                  <span>{st.polar === 'day' ? t('world.polarDay', 'Midnight sun') : t('world.polarNight', 'Polar night')}</span>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

export function Settings() {
  const t = useT();
  const [s, set] = useModeSettings('world');
  return (
    <>
      <Section title={t('world.cities', 'Cities')}>
        <CityList ids={s.cities} onChange={(ids) => set((d) => void (d.cities = ids))} max={12} min={1} />
      </Section>
      <Section title={t('o.options', 'Options')}>
        <Toggle checked={s.showSeconds} onChange={(v) => set((d) => void (d.showSeconds = v))} label={t('o.seconds', 'Show seconds')} />
        <Toggle checked={s.showOffset} onChange={(v) => set((d) => void (d.showOffset = v))} label={t('world.offset', 'Offset from local time')} />
        <Toggle checked={s.showSun} onChange={(v) => set((d) => void (d.showSun = v))} label={t('world.sun', 'Sunrise & sunset')} />
      </Section>
    </>
  );
}
