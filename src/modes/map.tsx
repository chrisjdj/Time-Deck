import { useMemo } from 'react';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { MultiPolygon, Polygon } from 'geojson';
import landTopo from 'world-atlas/land-110m.json';
import { CityList } from '../components/CityPicker';
import { Section, Toggle } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { useT } from '../i18n';
import { getCity, type City } from '../data/cities';
import { nightPolygon, subsolarPoint, isDaylight } from '../lib/solar';
import { timeText } from '../lib/tz';
import { useModeSettings, type DisplayProps } from './common';

const W = 360;
const H = 180;
const px = (lon: number) => lon + 180;
const py = (lat: number) => 90 - lat;

/** Build an SVG path for land, breaking rings at the antimeridian. */
function buildLandPath(): string {
  const topo = landTopo as unknown as Topology<{ land: GeometryCollection }>;
  const geo = feature(topo, topo.objects.land) as unknown as { features: Array<{ geometry: Polygon | MultiPolygon }> } | { geometry: Polygon | MultiPolygon };
  const geoms = 'features' in geo ? geo.features.map((f) => f.geometry) : [geo.geometry];
  let d = '';
  for (const g of geoms) {
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    for (const poly of polys) {
      for (const ring of poly) {
        let prev: number | null = null;
        ring.forEach(([lon, lat], i) => {
          const jump = prev !== null && Math.abs(lon - prev) > 180;
          d += (i === 0 || jump ? 'M' : 'L') + px(lon).toFixed(2) + ' ' + py(lat).toFixed(2);
          prev = lon;
        });
        d += 'Z';
      }
    }
  }
  return d;
}

let LAND: string | null = null;

export function Display({ config }: DisplayProps) {
  const s = config.settings.map;
  const t = useT();
  const now = useNow('minute');
  const land = useMemo(() => (LAND ??= buildLandPath()), []);
  const night = useMemo(() => {
    const pts = nightPolygon(now, 2);
    return 'M' + pts.map(([lon, lat]) => `${px(lon).toFixed(2)} ${py(lat).toFixed(2)}`).join('L') + 'Z';
  }, [now]);
  const sun = subsolarPoint(now);
  const cities = s.cities.map(getCity).filter((c): c is City => !!c && c.lat !== null && c.lon !== null);
  const h12 = config.appearance.hour12;
  return (
    <div className="m-map">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={t('map.aria', 'World map with day and night')}>
        <defs>
          <filter id="tdblur" x="-5%" y="-10%" width="110%" height="120%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
          <radialGradient id="tdsun">
            <stop offset="0" stopColor="#ffd76a" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffd76a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect className="m-map__sea" width={W} height={H} />
        {[-60, -30, 0, 30, 60].map((lat) => (
          <line key={lat} className="m-map__grat" x1="0" x2={W} y1={py(lat)} y2={py(lat)} />
        ))}
        {[-120, -60, 0, 60, 120].map((lon) => (
          <line key={lon} className="m-map__grat" y1="0" y2={H} x1={px(lon)} x2={px(lon)} />
        ))}
        <path className="m-map__land" d={land} />
        <path className="m-map__night m-map__night--soft" d={night} filter="url(#tdblur)" />
        <path className="m-map__night" d={night} />
        <circle cx={px(sun.lon)} cy={py(sun.lat)} r="14" fill="url(#tdsun)" />
        <circle cx={px(sun.lon)} cy={py(sun.lat)} r="2.6" className="m-map__sun" />
        {cities.map((c) => {
          const x = px(c.lon!);
          const y = py(c.lat!);
          const tt = timeText(now, c.tz, h12);
          const day = isDaylight(now, c.lat!, c.lon!);
          const right = x > W - 50;
          return (
            <g key={c.id} className={'m-map__pin' + (day ? ' is-day' : ' is-night')}>
              <circle cx={x} cy={y} r="1.8" />
              <circle cx={x} cy={y} r="3.6" className="m-map__pulse" />
              {s.showLabels && (
                <text x={right ? x - 4 : x + 4} y={y - 2.5} textAnchor={right ? 'end' : 'start'}>
                  <tspan className="m-map__city">{c.name}</tspan>
                  <tspan x={right ? x - 4 : x + 4} dy="6.5" className="m-map__time">
                    {tt.hm}
                    {tt.period && ' ' + tt.period}
                  </tspan>
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function Settings() {
  const t = useT();
  const [s, set] = useModeSettings('map');
  return (
    <>
      <Section title={t('world.cities', 'Cities')}>
        <CityList ids={s.cities} onChange={(ids) => set((d) => void (d.cities = ids))} max={16} />
        <p className="muted small">{t('map.hint', 'The shaded area is night; the glow marks where the sun is overhead. Updates every minute.')}</p>
      </Section>
      <Section title={t('o.options', 'Options')}>
        <Toggle checked={s.showLabels} onChange={(v) => set((d) => void (d.showLabels = v))} label={t('map.labels', 'City labels')} />
      </Section>
    </>
  );
}
