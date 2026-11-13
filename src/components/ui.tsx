import { useId, useState, type ReactNode } from 'react';
import { formatCountdown, parseDuration } from '../lib/time';
import { useDeck } from '../store/deck';
import { useT } from '../i18n';

/** Quick 12h (AM/PM) / 24h switch bound to the global appearance.hour12 setting. */
export function HourFormatSwitch({ size }: { size?: 'sm' }) {
  const t = useT();
  const hour12 = useDeck((s) => s.config.appearance.hour12);
  const update = useDeck((s) => s.update);
  return (
    <div className="hour-switch">
      <span className="hour-switch__label">{t('hf.label', 'Time format')}</span>
      <Segmented
        size={size}
        label={t('hf.label', 'Time format')}
        value={hour12 ? '12' : '24'}
        onChange={(v) => update((c) => void (c.appearance.hour12 = v === '12'))}
        options={[
          { value: '12', label: t('hf.12', '12h · AM/PM') },
          { value: '24', label: t('hf.24', '24h') },
        ]}
      />
    </div>
  );
}

export function Field({ label, hint, children, inline }: { label: ReactNode; hint?: ReactNode; children: ReactNode; inline?: boolean }) {
  return (
    <label className={'field' + (inline ? ' field--inline' : '')}>
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode }) {
  const id = useId();
  return (
    <div className="toggle-row">
      <label htmlFor={id} className="toggle-row__text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </label>
      <button id={id} type="button" role="switch" aria-checked={checked} className={'switch' + (checked ? ' is-on' : '')} onClick={() => onChange(!checked)}>
        <span className="switch__knob" />
      </button>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size,
}: {
  value: T;
  options: Array<{ value: T; label: ReactNode; title?: string }>;
  onChange: (v: T) => void;
  label?: string;
  size?: 'sm';
}) {
  return (
    <div className={'segmented' + (size ? ' segmented--' + size : '')} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          className={value === o.value ? 'is-active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  ariaLabel?: string;
}) {
  const [text, setText] = useState(String(value));
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    // external value changed: re-sync the draft text (render-time reset pattern)
    setPrev(value);
    setText(String(value));
  }
  const commit = (s: string) => {
    let n = parseFloat(s);
    if (!Number.isFinite(n)) n = value;
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    onChange(n);
    setText(String(n));
  };
  return (
    <div className="num-input">
      <input
        type="number"
        inputMode="decimal"
        value={text}
        min={min}
        max={max}
        step={step}
        aria-label={ariaLabel}
        onChange={(e) => {
          setText(e.target.value);
          const n = parseFloat(e.target.value);
          if (Number.isFinite(n) && (min === undefined || n >= min) && (max === undefined || n <= max)) onChange(n);
        }}
        onBlur={(e) => commit(e.target.value)}
      />
      {suffix && <span className="num-input__suffix">{suffix}</span>}
    </div>
  );
}

/** Free-form duration input: "5", "1:30", "1h 20m", "45s". */
export function DurationInput({ ms, onChange, ariaLabel }: { ms: number; onChange: (ms: number) => void; ariaLabel?: string }) {
  const [text, setText] = useState(formatCountdown(ms, { forceHours: ms >= 3600000 }));
  const [bad, setBad] = useState(false);
  const [prev, setPrev] = useState(ms);
  if (prev !== ms) {
    setPrev(ms);
    setText(formatCountdown(ms, { forceHours: ms >= 3600000 }));
  }
  const commit = () => {
    const v = parseDuration(text);
    if (v && v > 0) {
      setBad(false);
      onChange(v);
    } else setBad(true);
  };
  return (
    <input
      className={'text-input mono' + (bad ? ' is-invalid' : '')}
      value={text}
      aria-label={ariaLabel}
      aria-invalid={bad}
      placeholder="m:ss / 1h 20m"
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
    />
  );
}

export function Select<T extends string>({ value, onChange, options, ariaLabel }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }>; ariaLabel?: string }) {
  return (
    <select className="select" value={value} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Section({ title, children, actions }: { title: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="panel-section">
      <header className="panel-section__head">
        <h3>{title}</h3>
        {actions}
      </header>
      <div className="panel-section__body">{children}</div>
    </section>
  );
}

export function IconButton({ label, children, onClick, active, className, disabled, size }: { label: string; children: ReactNode; onClick?: () => void; active?: boolean; className?: string; disabled?: boolean; size?: 'lg' | 'sm' }) {
  return (
    <button
      type="button"
      className={'icon-btn' + (active ? ' is-active' : '') + (size ? ' icon-btn--' + size : '') + (className ? ' ' + className : '')}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
