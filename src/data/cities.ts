import { allTimeZones, localTz } from '../lib/tz';

export interface City {
  id: string;
  name: string;
  cc: string; // ISO country code ('' = unknown)
  tz: string;
  lat: number | null;
  lon: number | null;
}

// [name, countryCode, timeZone, lat, lon]
type Row = [string, string, string, number, number];

const ROWS: Row[] = [
  // Americas
  ['New York', 'US', 'America/New_York', 40.71, -74.01],
  ['Los Angeles', 'US', 'America/Los_Angeles', 34.05, -118.24],
  ['San Francisco', 'US', 'America/Los_Angeles', 37.77, -122.42],
  ['Seattle', 'US', 'America/Los_Angeles', 47.61, -122.33],
  ['Chicago', 'US', 'America/Chicago', 41.88, -87.63],
  ['Houston', 'US', 'America/Chicago', 29.76, -95.37],
  ['Dallas', 'US', 'America/Chicago', 32.78, -96.8],
  ['Austin', 'US', 'America/Chicago', 30.27, -97.74],
  ['Denver', 'US', 'America/Denver', 39.74, -104.99],
  ['Phoenix', 'US', 'America/Phoenix', 33.45, -112.07],
  ['Las Vegas', 'US', 'America/Los_Angeles', 36.17, -115.14],
  ['Miami', 'US', 'America/New_York', 25.76, -80.19],
  ['Atlanta', 'US', 'America/New_York', 33.75, -84.39],
  ['Boston', 'US', 'America/New_York', 42.36, -71.06],
  ['Washington DC', 'US', 'America/New_York', 38.91, -77.04],
  ['Philadelphia', 'US', 'America/New_York', 39.95, -75.17],
  ['Detroit', 'US', 'America/Detroit', 42.33, -83.05],
  ['Anchorage', 'US', 'America/Anchorage', 61.22, -149.9],
  ['Honolulu', 'US', 'Pacific/Honolulu', 21.31, -157.86],
  ['Toronto', 'CA', 'America/Toronto', 43.65, -79.38],
  ['Montreal', 'CA', 'America/Toronto', 45.5, -73.57],
  ['Vancouver', 'CA', 'America/Vancouver', 49.28, -123.12],
  ['Calgary', 'CA', 'America/Edmonton', 51.05, -114.07],
  ['Winnipeg', 'CA', 'America/Winnipeg', 49.9, -97.14],
  ['Halifax', 'CA', 'America/Halifax', 44.65, -63.58],
  ["St. John's", 'CA', 'America/St_Johns', 47.56, -52.71],
  ['Mexico City', 'MX', 'America/Mexico_City', 19.43, -99.13],
  ['Guadalajara', 'MX', 'America/Mexico_City', 20.66, -103.35],
  ['Monterrey', 'MX', 'America/Monterrey', 25.69, -100.32],
  ['Cancún', 'MX', 'America/Cancun', 21.16, -86.85],
  ['Tijuana', 'MX', 'America/Tijuana', 32.51, -117.04],
  ['Guatemala City', 'GT', 'America/Guatemala', 14.63, -90.51],
  ['San José', 'CR', 'America/Costa_Rica', 9.93, -84.08],
  ['Panama City', 'PA', 'America/Panama', 8.98, -79.52],
  ['Havana', 'CU', 'America/Havana', 23.11, -82.37],
  ['Kingston', 'JM', 'America/Jamaica', 18.02, -76.8],
  ['Santo Domingo', 'DO', 'America/Santo_Domingo', 18.49, -69.93],
  ['San Juan', 'PR', 'America/Puerto_Rico', 18.47, -66.11],
  ['Bogotá', 'CO', 'America/Bogota', 4.71, -74.07],
  ['Medellín', 'CO', 'America/Bogota', 6.24, -75.58],
  ['Caracas', 'VE', 'America/Caracas', 10.48, -66.9],
  ['Quito', 'EC', 'America/Guayaquil', -0.18, -78.47],
  ['Lima', 'PE', 'America/Lima', -12.05, -77.04],
  ['La Paz', 'BO', 'America/La_Paz', -16.5, -68.15],
  ['Santiago', 'CL', 'America/Santiago', -33.45, -70.67],
  ['Buenos Aires', 'AR', 'America/Argentina/Buenos_Aires', -34.6, -58.38],
  ['Montevideo', 'UY', 'America/Montevideo', -34.9, -56.16],
  ['Asunción', 'PY', 'America/Asuncion', -25.26, -57.58],
  ['São Paulo', 'BR', 'America/Sao_Paulo', -23.55, -46.63],
  ['Rio de Janeiro', 'BR', 'America/Sao_Paulo', -22.91, -43.17],
  ['Brasília', 'BR', 'America/Sao_Paulo', -15.79, -47.88],
  ['Manaus', 'BR', 'America/Manaus', -3.12, -60.02],
  ['Recife', 'BR', 'America/Recife', -8.05, -34.88],
  ['Nuuk', 'GL', 'America/Nuuk', 64.18, -51.72],
  // Europe
  ['London', 'GB', 'Europe/London', 51.51, -0.13],
  ['Manchester', 'GB', 'Europe/London', 53.48, -2.24],
  ['Edinburgh', 'GB', 'Europe/London', 55.95, -3.19],
  ['Dublin', 'IE', 'Europe/Dublin', 53.35, -6.26],
  ['Lisbon', 'PT', 'Europe/Lisbon', 38.72, -9.14],
  ['Porto', 'PT', 'Europe/Lisbon', 41.15, -8.61],
  ['Madrid', 'ES', 'Europe/Madrid', 40.42, -3.7],
  ['Barcelona', 'ES', 'Europe/Madrid', 41.39, 2.17],
  ['Canary Islands', 'ES', 'Atlantic/Canary', 28.12, -15.43],
  ['Paris', 'FR', 'Europe/Paris', 48.86, 2.35],
  ['Lyon', 'FR', 'Europe/Paris', 45.76, 4.84],
  ['Brussels', 'BE', 'Europe/Brussels', 50.85, 4.35],
  ['Amsterdam', 'NL', 'Europe/Amsterdam', 52.37, 4.9],
  ['Luxembourg', 'LU', 'Europe/Luxembourg', 49.61, 6.13],
  ['Berlin', 'DE', 'Europe/Berlin', 52.52, 13.4],
  ['Munich', 'DE', 'Europe/Berlin', 48.14, 11.58],
  ['Frankfurt', 'DE', 'Europe/Berlin', 50.11, 8.68],
  ['Hamburg', 'DE', 'Europe/Berlin', 53.55, 9.99],
  ['Zurich', 'CH', 'Europe/Zurich', 47.38, 8.54],
  ['Geneva', 'CH', 'Europe/Zurich', 46.2, 6.14],
  ['Vienna', 'AT', 'Europe/Vienna', 48.21, 16.37],
  ['Rome', 'IT', 'Europe/Rome', 41.9, 12.5],
  ['Milan', 'IT', 'Europe/Rome', 45.46, 9.19],
  ['Copenhagen', 'DK', 'Europe/Copenhagen', 55.68, 12.57],
  ['Oslo', 'NO', 'Europe/Oslo', 59.91, 10.75],
  ['Stockholm', 'SE', 'Europe/Stockholm', 59.33, 18.07],
  ['Helsinki', 'FI', 'Europe/Helsinki', 60.17, 24.94],
  ['Reykjavík', 'IS', 'Atlantic/Reykjavik', 64.15, -21.94],
  ['Tallinn', 'EE', 'Europe/Tallinn', 59.44, 24.75],
  ['Riga', 'LV', 'Europe/Riga', 56.95, 24.11],
  ['Vilnius', 'LT', 'Europe/Vilnius', 54.69, 25.28],
  ['Warsaw', 'PL', 'Europe/Warsaw', 52.23, 21.01],
  ['Kraków', 'PL', 'Europe/Warsaw', 50.06, 19.94],
  ['Prague', 'CZ', 'Europe/Prague', 50.08, 14.44],
  ['Budapest', 'HU', 'Europe/Budapest', 47.5, 19.04],
  ['Bratislava', 'SK', 'Europe/Bratislava', 48.15, 17.11],
  ['Ljubljana', 'SI', 'Europe/Ljubljana', 46.06, 14.51],
  ['Zagreb', 'HR', 'Europe/Zagreb', 45.81, 15.98],
  ['Belgrade', 'RS', 'Europe/Belgrade', 44.79, 20.45],
  ['Bucharest', 'RO', 'Europe/Bucharest', 44.43, 26.1],
  ['Sofia', 'BG', 'Europe/Sofia', 42.7, 23.32],
  ['Athens', 'GR', 'Europe/Athens', 37.98, 23.73],
  ['Istanbul', 'TR', 'Europe/Istanbul', 41.01, 28.98],
  ['Ankara', 'TR', 'Europe/Istanbul', 39.93, 32.86],
  ['Kyiv', 'UA', 'Europe/Kyiv', 50.45, 30.52],
  ['Minsk', 'BY', 'Europe/Minsk', 53.9, 27.56],
  ['Chișinău', 'MD', 'Europe/Chisinau', 47.01, 28.86],
  ['Moscow', 'RU', 'Europe/Moscow', 55.76, 37.62],
  ['Saint Petersburg', 'RU', 'Europe/Moscow', 59.93, 30.36],
  ['Valletta', 'MT', 'Europe/Malta', 35.9, 14.51],
  ['Nicosia', 'CY', 'Asia/Nicosia', 35.19, 33.38],
  // Africa
  ['Cairo', 'EG', 'Africa/Cairo', 30.04, 31.24],
  ['Casablanca', 'MA', 'Africa/Casablanca', 33.57, -7.59],
  ['Tunis', 'TN', 'Africa/Tunis', 36.81, 10.18],
  ['Algiers', 'DZ', 'Africa/Algiers', 36.75, 3.06],
  ['Lagos', 'NG', 'Africa/Lagos', 6.52, 3.38],
  ['Abuja', 'NG', 'Africa/Lagos', 9.08, 7.4],
  ['Accra', 'GH', 'Africa/Accra', 5.6, -0.19],
  ['Dakar', 'SN', 'Africa/Dakar', 14.72, -17.47],
  ['Abidjan', 'CI', 'Africa/Abidjan', 5.36, -4.01],
  ['Nairobi', 'KE', 'Africa/Nairobi', -1.29, 36.82],
  ['Addis Ababa', 'ET', 'Africa/Addis_Ababa', 9.03, 38.74],
  ['Dar es Salaam', 'TZ', 'Africa/Dar_es_Salaam', -6.79, 39.21],
  ['Kampala', 'UG', 'Africa/Kampala', 0.35, 32.58],
  ['Kigali', 'RW', 'Africa/Kigali', -1.95, 30.06],
  ['Kinshasa', 'CD', 'Africa/Kinshasa', -4.44, 15.27],
  ['Luanda', 'AO', 'Africa/Luanda', -8.84, 13.23],
  ['Johannesburg', 'ZA', 'Africa/Johannesburg', -26.2, 28.05],
  ['Cape Town', 'ZA', 'Africa/Johannesburg', -33.92, 18.42],
  ['Harare', 'ZW', 'Africa/Harare', -17.83, 31.05],
  ['Lusaka', 'ZM', 'Africa/Lusaka', -15.39, 28.32],
  ['Maputo', 'MZ', 'Africa/Maputo', -25.97, 32.57],
  ['Windhoek', 'NA', 'Africa/Windhoek', -22.56, 17.08],
  ['Khartoum', 'SD', 'Africa/Khartoum', 15.5, 32.56],
  ['Antananarivo', 'MG', 'Indian/Antananarivo', -18.88, 47.51],
  ['Port Louis', 'MU', 'Indian/Mauritius', -20.16, 57.5],
  // Middle East
  ['Dubai', 'AE', 'Asia/Dubai', 25.2, 55.27],
  ['Abu Dhabi', 'AE', 'Asia/Dubai', 24.45, 54.38],
  ['Doha', 'QA', 'Asia/Qatar', 25.29, 51.53],
  ['Riyadh', 'SA', 'Asia/Riyadh', 24.71, 46.68],
  ['Jeddah', 'SA', 'Asia/Riyadh', 21.49, 39.19],
  ['Kuwait City', 'KW', 'Asia/Kuwait', 29.38, 47.99],
  ['Manama', 'BH', 'Asia/Bahrain', 26.23, 50.59],
  ['Muscat', 'OM', 'Asia/Muscat', 23.59, 58.41],
  ['Tehran', 'IR', 'Asia/Tehran', 35.69, 51.39],
  ['Baghdad', 'IQ', 'Asia/Baghdad', 33.31, 44.36],
  ['Amman', 'JO', 'Asia/Amman', 31.95, 35.93],
  ['Beirut', 'LB', 'Asia/Beirut', 33.89, 35.5],
  ['Jerusalem', 'IL', 'Asia/Jerusalem', 31.77, 35.21],
  ['Tel Aviv', 'IL', 'Asia/Jerusalem', 32.09, 34.78],
  ['Damascus', 'SY', 'Asia/Damascus', 33.51, 36.28],
  ['Baku', 'AZ', 'Asia/Baku', 40.41, 49.87],
  ['Tbilisi', 'GE', 'Asia/Tbilisi', 41.72, 44.79],
  ['Yerevan', 'AM', 'Asia/Yerevan', 40.18, 44.51],
  // South & Central Asia
  ['Kabul', 'AF', 'Asia/Kabul', 34.56, 69.21],
  ['Tashkent', 'UZ', 'Asia/Tashkent', 41.3, 69.24],
  ['Almaty', 'KZ', 'Asia/Almaty', 43.24, 76.89],
  ['Astana', 'KZ', 'Asia/Almaty', 51.17, 71.45],
  ['Karachi', 'PK', 'Asia/Karachi', 24.86, 67.0],
  ['Lahore', 'PK', 'Asia/Karachi', 31.55, 74.34],
  ['Islamabad', 'PK', 'Asia/Karachi', 33.68, 73.05],
  ['New Delhi', 'IN', 'Asia/Kolkata', 28.61, 77.21],
  ['Mumbai', 'IN', 'Asia/Kolkata', 19.08, 72.88],
  ['Bengaluru', 'IN', 'Asia/Kolkata', 12.97, 77.59],
  ['Chennai', 'IN', 'Asia/Kolkata', 13.08, 80.27],
  ['Kolkata', 'IN', 'Asia/Kolkata', 22.57, 88.36],
  ['Hyderabad', 'IN', 'Asia/Kolkata', 17.39, 78.49],
  ['Pune', 'IN', 'Asia/Kolkata', 18.52, 73.86],
  ['Kochi', 'IN', 'Asia/Kolkata', 9.93, 76.27],
  ['Thiruvananthapuram', 'IN', 'Asia/Kolkata', 8.52, 76.94],
  ['Ahmedabad', 'IN', 'Asia/Kolkata', 23.02, 72.57],
  ['Colombo', 'LK', 'Asia/Colombo', 6.93, 79.86],
  ['Kathmandu', 'NP', 'Asia/Kathmandu', 27.72, 85.32],
  ['Thimphu', 'BT', 'Asia/Thimphu', 27.47, 89.64],
  ['Dhaka', 'BD', 'Asia/Dhaka', 23.81, 90.41],
  ['Malé', 'MV', 'Indian/Maldives', 4.18, 73.51],
  // East & Southeast Asia
  ['Yangon', 'MM', 'Asia/Yangon', 16.87, 96.2],
  ['Bangkok', 'TH', 'Asia/Bangkok', 13.76, 100.5],
  ['Hanoi', 'VN', 'Asia/Ho_Chi_Minh', 21.03, 105.85],
  ['Ho Chi Minh City', 'VN', 'Asia/Ho_Chi_Minh', 10.82, 106.63],
  ['Phnom Penh', 'KH', 'Asia/Phnom_Penh', 11.56, 104.93],
  ['Vientiane', 'LA', 'Asia/Vientiane', 17.98, 102.63],
  ['Kuala Lumpur', 'MY', 'Asia/Kuala_Lumpur', 3.14, 101.69],
  ['Singapore', 'SG', 'Asia/Singapore', 1.35, 103.82],
  ['Jakarta', 'ID', 'Asia/Jakarta', -6.21, 106.85],
  ['Bali', 'ID', 'Asia/Makassar', -8.65, 115.22],
  ['Manila', 'PH', 'Asia/Manila', 14.6, 120.98],
  ['Hong Kong', 'HK', 'Asia/Hong_Kong', 22.32, 114.17],
  ['Macau', 'MO', 'Asia/Macau', 22.2, 113.54],
  ['Taipei', 'TW', 'Asia/Taipei', 25.03, 121.57],
  ['Beijing', 'CN', 'Asia/Shanghai', 39.9, 116.4],
  ['Shanghai', 'CN', 'Asia/Shanghai', 31.23, 121.47],
  ['Shenzhen', 'CN', 'Asia/Shanghai', 22.54, 114.06],
  ['Guangzhou', 'CN', 'Asia/Shanghai', 23.13, 113.26],
  ['Chengdu', 'CN', 'Asia/Shanghai', 30.57, 104.07],
  ['Ulaanbaatar', 'MN', 'Asia/Ulaanbaatar', 47.89, 106.91],
  ['Seoul', 'KR', 'Asia/Seoul', 37.57, 126.98],
  ['Busan', 'KR', 'Asia/Seoul', 35.18, 129.08],
  ['Pyongyang', 'KP', 'Asia/Pyongyang', 39.04, 125.76],
  ['Tokyo', 'JP', 'Asia/Tokyo', 35.68, 139.69],
  ['Osaka', 'JP', 'Asia/Tokyo', 34.69, 135.5],
  ['Sapporo', 'JP', 'Asia/Tokyo', 43.06, 141.35],
  ['Vladivostok', 'RU', 'Asia/Vladivostok', 43.12, 131.89],
  ['Novosibirsk', 'RU', 'Asia/Novosibirsk', 55.01, 82.93],
  ['Yekaterinburg', 'RU', 'Asia/Yekaterinburg', 56.84, 60.6],
  // Oceania
  ['Sydney', 'AU', 'Australia/Sydney', -33.87, 151.21],
  ['Melbourne', 'AU', 'Australia/Melbourne', -37.81, 144.96],
  ['Brisbane', 'AU', 'Australia/Brisbane', -27.47, 153.03],
  ['Perth', 'AU', 'Australia/Perth', -31.95, 115.86],
  ['Adelaide', 'AU', 'Australia/Adelaide', -34.93, 138.6],
  ['Darwin', 'AU', 'Australia/Darwin', -12.46, 130.84],
  ['Hobart', 'AU', 'Australia/Hobart', -42.88, 147.33],
  ['Canberra', 'AU', 'Australia/Sydney', -35.28, 149.13],
  ['Auckland', 'NZ', 'Pacific/Auckland', -36.85, 174.76],
  ['Wellington', 'NZ', 'Pacific/Auckland', -41.29, 174.78],
  ['Chatham Islands', 'NZ', 'Pacific/Chatham', -43.95, -176.56],
  ['Suva', 'FJ', 'Pacific/Fiji', -18.14, 178.44],
  ['Port Moresby', 'PG', 'Pacific/Port_Moresby', -9.44, 147.18],
  ['Nouméa', 'NC', 'Pacific/Noumea', -22.28, 166.46],
  ['Apia', 'WS', 'Pacific/Apia', -13.83, -171.76],
  ['Tonga', 'TO', 'Pacific/Tongatapu', -21.14, -175.2],
  ['Kiritimati', 'KI', 'Pacific/Kiritimati', 1.87, -157.43],
  ['Tahiti', 'PF', 'Pacific/Tahiti', -17.53, -149.57],
  ['Guam', 'GU', 'Pacific/Guam', 13.44, 144.79],
  // Special
  ['UTC', '', 'UTC', 51.48, 0],
];

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const CITIES: City[] = ROWS.map(([name, cc, tz, lat, lon]) => ({
  id: slug(name),
  name,
  cc,
  tz,
  lat,
  lon,
}));

const byId = new Map(CITIES.map((c) => [c.id, c]));
const zoneCities = new Map<string, City>();

/** Resolve a city id. Supports curated ids and 'tz:Area/City' ids for any IANA zone. */
export function getCity(id: string): City | undefined {
  const hit = byId.get(id);
  if (hit) return hit;
  if (id.startsWith('tz:')) {
    let c = zoneCities.get(id);
    if (!c) {
      const tz = canonicalTz(id.slice(3));
      const curated = CITIES.find((x) => x.tz === tz && x.name === zoneName(tz)) ?? CITIES.find((x) => x.tz === tz);
      if (curated) return curated;
      c = { id, name: zoneName(tz), cc: '', tz, lat: null, lon: null };
      zoneCities.set(id, c);
    }
    return c;
  }
  return undefined;
}

export function zoneName(tz: string): string {
  const last = tz.split('/').pop() || tz;
  return last.replace(/_/g, ' ');
}

/** Legacy IANA names that browsers (ICU) still report, mapped to the current names. */
const TZ_ALIASES: Record<string, string> = {
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Rangoon': 'Asia/Yangon',
  'Asia/Ulan_Bator': 'Asia/Ulaanbaatar',
  'Asia/Dacca': 'Asia/Dhaka',
  'Asia/Thimbu': 'Asia/Thimphu',
  'Asia/Macao': 'Asia/Macau',
  'Europe/Kiev': 'Europe/Kyiv',
  'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
  'America/Godthab': 'America/Nuuk',
  'Atlantic/Faeroe': 'Atlantic/Faroe',
  'Pacific/Truk': 'Pacific/Chuuk',
  'Pacific/Ponape': 'Pacific/Pohnpei',
  'Pacific/Enderbury': 'Pacific/Kanton',
  'US/Eastern': 'America/New_York',
  'US/Central': 'America/Chicago',
  'US/Mountain': 'America/Denver',
  'US/Pacific': 'America/Los_Angeles',
  'Etc/UTC': 'UTC',
  'Etc/GMT': 'UTC',
  GMT: 'UTC',
};

export function canonicalTz(tz: string): string {
  return TZ_ALIASES[tz] ?? tz;
}

/** City for the user's own timezone (best effort). */
export function localCity(): City {
  const tz = canonicalTz(localTz());
  return CITIES.find((c) => c.tz === tz) ?? getCity('tz:' + tz)!;
}

export function flag(cc: string): string {
  if (!cc || cc.length !== 2) return '🌐';
  return String.fromCodePoint(...[...cc.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

let regionNames: Intl.DisplayNames | null = null;
let regionLocale = '';
export function countryName(cc: string, locale: string): string {
  if (!cc) return '';
  try {
    if (!regionNames || regionLocale !== locale) {
      regionNames = new Intl.DisplayNames([locale, 'en'], { type: 'region' });
      regionLocale = locale;
    }
    return regionNames.of(cc) ?? cc;
  } catch {
    return cc;
  }
}

/** Search curated cities first, then any IANA zone. */
export function searchCities(q: string, locale: string, limit = 12): City[] {
  const s = slug(q);
  if (!s) return CITIES.slice(0, limit);
  const scored: Array<[number, City]> = [];
  for (const c of CITIES) {
    const n = slug(c.name);
    const country = slug(countryName(c.cc, locale));
    const tzs = slug(c.tz);
    let score = -1;
    if (n.startsWith(s)) score = 0;
    else if (n.includes(s)) score = 1;
    else if (country.startsWith(s) || c.cc.toLowerCase() === s) score = 2;
    else if (tzs.includes(s)) score = 3;
    if (score >= 0) scored.push([score, c]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name));
  const out = scored.map((x) => x[1]);
  if (out.length < limit) {
    const known = new Set(CITIES.map((c) => c.tz));
    for (const tz of allTimeZones()) {
      if (out.length >= limit) break;
      if (known.has(tz) || known.has(canonicalTz(tz))) continue;
      if (slug(tz).includes(s)) out.push(getCity('tz:' + tz)!);
    }
  }
  return out.slice(0, limit);
}
