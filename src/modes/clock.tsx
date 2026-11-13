import { AnalogClock, BigTime, Label } from '../components/display';
import { CitySelect } from '../components/CityPicker';
import { Section, Segmented, Toggle } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { useLocale, useT } from '../i18n';
import { getCity, flag } from '../data/cities';
import { dateText, isoWeek, localTz, timeText, zonedParts } from '../lib/tz';
import { useModeSettings, type DisplayProps } from './common';

export function Display({ config }: DisplayProps) {
  const s = config.settings.clock;
  const t = useT();
  const locale = useLocale();
  const analogSmooth = s.face === 'analog' && s.showSeconds;
  const now = useNow(analogSmooth ? 'frame' : 'second');
  const city = s.city ? getCity(s.city) : null;
  const tz = city?.tz ?? localTz();
  const hour12 = config.appearance.hour12;
  const tt = timeText(now, tz, hour12);
  const extras: string[] = [];
  if (s.showUtc) {
    const u = timeText(now, 'UTC', hour12);
    extras.push(`UTC ${u.hm}${u.period ? ' ' + u.period : ''}`);
  }
  if (s.showIsoWeek) extras.push(t('clock.week', 'Week {n}', { n: isoWeek(now, tz) }));
  if (s.showUnix) extras.push(`Unix ${Math.floor(now / 1000)}`);

  return (
    <div className={'m-clock m-clock--' + s.face}>
      {city && <Label className="m-clock__city">{flag(city.cc)} {city.name}</Label>}
      {s.face === 'analog' ? (
        (() => {
          const p = zonedParts(now, tz);
          return (
            <div className="m-clock__analog">
              <AnalogClock h={p.hour} m={p.minute} s={p.second} ms={now % 1000} showSeconds={s.showSeconds} />
            </div>
          );
        })()
      ) : (
        <BigTime
          text={s.showSeconds ? `${tt.hm}:${tt.sec}` : tt.hm}
          suffix={tt.period || undefined}
          label={`${tt.hm} ${tt.period}`}
        />
      )}
      {s.showDate && <div className="d-sub">{dateText(now, tz, locale)}</div>}
      {extras.length > 0 && <div className="d-extra">{extras.join('  ·  ')}</div>}
    </div>
  );
}

export function Settings() {
  const t = useT();
  const [s, set] = useModeSettings('clock');
  return (
    <>
      <Section title={t('clock.face', 'Clock face')}>
        <Segmented
          value={s.face}
          onChange={(v) => set((d) => void (d.face = v))}
          options={[
            { value: 'digital', label: t('clock.digital', 'Digital') },
            { value: 'analog', label: t('clock.analog', 'Analog') },
          ]}
        />
        <Toggle checked={s.showSeconds} onChange={(v) => set((d) => void (d.showSeconds = v))} label={t('o.seconds', 'Show seconds')} />
        <Toggle checked={s.showDate} onChange={(v) => set((d) => void (d.showDate = v))} label={t('o.date', 'Show date')} />
      </Section>
      <Section title={t('clock.zone', 'Time zone')}>
        <CitySelect id={s.city} onChange={(id) => set((d) => void (d.city = id))} />
      </Section>
      <Section title={t('clock.extras', 'Extra info')}>
        <Toggle checked={s.showUtc} onChange={(v) => set((d) => void (d.showUtc = v))} label={t('clock.utc', 'UTC time')} />
        <Toggle checked={s.showIsoWeek} onChange={(v) => set((d) => void (d.showIsoWeek = v))} label={t('clock.isoWeek', 'ISO week number')} />
        <Toggle checked={s.showUnix} onChange={(v) => set((d) => void (d.showUnix = v))} label={t('clock.unix', 'Unix timestamp')} />
      </Section>
    </>
  );
}
