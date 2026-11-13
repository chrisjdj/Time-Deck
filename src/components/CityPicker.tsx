import { useId, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Plus, X } from 'lucide-react';
import { countryName, flag, getCity, searchCities, type City } from '../data/cities';
import { useLocale, useT } from '../i18n';
import { utcLabel } from '../lib/tz';

export function CitySearch({ onPick, exclude = [], placeholder }: { onPick: (c: City) => void; exclude?: string[]; placeholder?: string }) {
  const t = useT();
  const locale = useLocale();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const results = useMemo(() => searchCities(q, locale, 10).filter((c) => !exclude.includes(c.id)), [q, locale, exclude]);
  const listId = useId();
  const [now] = useState(() => Date.now());
  const pick = (c: City) => {
    onPick(c);
    setQ('');
    setHi(0);
  };
  return (
    <div className="city-search">
      <input
        className="text-input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder={placeholder ?? t('city.search', 'Search city, country or time zone…')}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setHi(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHi((h) => Math.min(results.length - 1, h + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHi((h) => Math.max(0, h - 1));
          } else if (e.key === 'Enter' && results[hi]) {
            e.preventDefault();
            pick(results[hi]);
          } else if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && results.length > 0 && (
        <ul className="city-search__list" id={listId} role="listbox">
          {results.map((c, i) => (
            <li
              key={c.id}
              role="option"
              aria-selected={i === hi}
              className={i === hi ? 'is-hi' : ''}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(c);
              }}
              onMouseEnter={() => setHi(i)}
            >
              <span className="city-search__flag">{flag(c.cc)}</span>
              <span className="city-search__name">
                {c.name}
                <small>{c.cc ? countryName(c.cc, locale) : c.tz}</small>
              </span>
              <span className="city-search__off">{utcLabel(now, c.tz)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Ordered multi-city list with search, drag reorder and remove. */
export function CityList({ ids, onChange, max = 12, min = 0 }: { ids: string[]; onChange: (ids: string[]) => void; max?: number; min?: number }) {
  const t = useT();
  const locale = useLocale();
  const [drag, setDrag] = useState<number | null>(null);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= ids.length || from === to) return;
    const next = [...ids];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };
  return (
    <div className="city-list">
      <ul>
        {ids.map((id, i) => {
          const c = getCity(id);
          if (!c) return null;
          return (
            <li
              key={id}
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => {
                e.preventDefault();
                if (drag !== null && drag !== i) {
                  move(drag, i);
                  setDrag(i);
                }
              }}
              onDragEnd={() => setDrag(null)}
              className={drag === i ? 'is-dragging' : ''}
            >
              <GripVertical size={14} className="city-list__grip" aria-hidden />
              <span className="city-search__flag">{flag(c.cc)}</span>
              <span className="city-list__name">
                {c.name}
                <small>{c.cc ? countryName(c.cc, locale) : c.tz}</small>
              </span>
              <button type="button" className="mini-btn" aria-label={t('a.moveUp', 'Move up')} onClick={() => move(i, i - 1)} disabled={i === 0}>
                <ArrowUp size={14} />
              </button>
              <button type="button" className="mini-btn" aria-label={t('a.moveDown', 'Move down')} onClick={() => move(i, i + 1)} disabled={i === ids.length - 1}>
                <ArrowDown size={14} />
              </button>
              <button type="button" className="mini-btn" aria-label={t('a.remove', 'Remove')} onClick={() => onChange(ids.filter((x) => x !== id))} disabled={ids.length <= min}>
                <X size={14} />
              </button>
            </li>
          );
        })}
      </ul>
      {ids.length < max ? (
        <div className="city-list__add">
          <Plus size={14} aria-hidden />
          <CitySearch exclude={ids} onPick={(c) => onChange([...ids, c.id])} placeholder={t('city.add', 'Add a city…')} />
        </div>
      ) : (
        <p className="muted small">{t('city.max', 'Maximum {n} cities', { n: max })}</p>
      )}
    </div>
  );
}

/** Single city selector with "local" option. */
export function CitySelect({ id, onChange, allowLocal = true }: { id: string; onChange: (id: string) => void; allowLocal?: boolean }) {
  const t = useT();
  const c = id ? getCity(id) : null;
  return (
    <div className="city-select">
      <div className="city-select__current">
        <span>{c ? `${flag(c.cc)} ${c.name}` : `📍 ${t('city.local', 'Local time')}`}</span>
        {c && allowLocal && (
          <button type="button" className="link-btn" onClick={() => onChange('')}>
            {t('city.useLocal', 'Use local')}
          </button>
        )}
      </div>
      <CitySearch onPick={(x) => onChange(x.id)} placeholder={t('city.change', 'Change city…')} />
    </div>
  );
}
