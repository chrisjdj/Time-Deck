import { Plus, X } from 'lucide-react';
import { BigTime, Label, ProgressBar, ProgressRing } from '../components/display';
import { Field, NumberInput, Section, Segmented, Select } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { useT } from '../i18n';
import { elapsed, formatCountdown, uid } from '../lib/time';
import { buildPhases, locate } from '../lib/sequence';
import type { IntervalPhase } from '../types';
import { useModeSettings, type DisplayProps } from './common';

export function Display({ config }: DisplayProps) {
  const s = config.settings.intervals;
  const run = config.runtime.intervals;
  const t = useT();
  const now = useNow(run.status === 'running' ? 'fast' : 'second');
  const phases = buildPhases(s, { work: t('int.focus', 'Focus'), short: t('int.short', 'Short break'), long: t('int.long', 'Long break') });
  const pos = locate(phases, elapsed(run, now));
  const totalRounds = phases.reduce((m, p) => Math.max(m, p.round), 0);
  if (!phases.length) return <div className="d-empty">{t('int.empty', 'Add at least one interval')}</div>;
  if (pos.done)
    return (
      <div className="m-intervals" data-kind="done">
        <div className="m-intervals__done">✓ {t('int.complete', 'Session complete')}</div>
        <Label className="d-sub">{t('int.total', 'Total')} {formatCountdown(pos.total)}</Label>
      </div>
    );
  const ph = pos.phase!;
  return (
    <div className="m-intervals" data-kind={ph.kind}>
      <ProgressRing value={pos.phaseRemaining / ph.ms} thickness={2.2} tone={ph.kind}>
        <div className="m-intervals__phase">{ph.label}</div>
        <BigTime text={formatCountdown(pos.phaseRemaining)} />
        <Label className={'d-status' + (run.status === 'paused' ? ' is-blink' : '')}>
          {run.status === 'paused'
            ? t('st.paused', 'Paused')
            : run.status === 'idle'
              ? t('st.ready', 'Ready')
              : `${t('int.round', 'Round')} ${ph.round}/${totalRounds}${pos.next ? ` · ${t('pr.next', 'Next')}: ${pos.next.label}` : ''}`}
        </Label>
      </ProgressRing>
      <div className="m-intervals__total">
        <ProgressBar value={pos.totalElapsed / pos.total} />
      </div>
    </div>
  );
}

export function Settings() {
  const t = useT();
  const [s, set] = useModeSettings('intervals');
  const phases = buildPhases(s);
  const total = phases.reduce((a, p) => a + p.ms, 0);
  return (
    <>
      <Section title={t('int.type', 'Type')}>
        <Segmented
          value={s.preset}
          onChange={(v) => set((d) => void (d.preset = v))}
          options={[
            { value: 'pomodoro', label: 'Pomodoro' },
            { value: 'custom', label: t('int.custom', 'Custom intervals') },
          ]}
        />
        <p className="muted small">
          {t('int.summary', '{n} phases · total {total}', { n: phases.length, total: formatCountdown(total) })}
        </p>
      </Section>
      {s.preset === 'pomodoro' ? (
        <Section title="Pomodoro">
          <Field label={t('int.focus', 'Focus')} inline>
            <NumberInput value={s.workMin} min={1} max={240} onChange={(v) => set((d) => void (d.workMin = v))} suffix="min" />
          </Field>
          <Field label={t('int.short', 'Short break')} inline>
            <NumberInput value={s.shortMin} min={0} max={120} onChange={(v) => set((d) => void (d.shortMin = v))} suffix="min" />
          </Field>
          <Field label={t('int.long', 'Long break')} inline>
            <NumberInput value={s.longMin} min={0} max={180} onChange={(v) => set((d) => void (d.longMin = v))} suffix="min" />
          </Field>
          <Field label={t('int.rounds', 'Focus rounds per set')} inline>
            <NumberInput value={s.rounds} min={1} max={12} onChange={(v) => set((d) => void (d.rounds = Math.round(v)))} />
          </Field>
          <Field label={t('int.sets', 'Sets')} inline>
            <NumberInput value={s.cycles} min={1} max={10} onChange={(v) => set((d) => void (d.cycles = Math.round(v)))} />
          </Field>
        </Section>
      ) : (
        <Section
          title={t('int.list', 'Intervals')}
          actions={
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => set((d) => void d.custom.push({ id: uid(), label: t('int.work', 'Work'), seconds: 30, kind: 'work' }))}>
              <Plus size={14} /> {t('a.add', 'Add')}
            </button>
          }
        >
          <ul className="seg-list">
            {s.custom.map((p, i) => (
              <li key={p.id} data-kind={p.kind}>
                <span className="seg-list__swatch" />
                <input className="text-input" value={p.label} onChange={(e) => set((d) => void (d.custom[i].label = e.target.value))} aria-label={t('int.label', 'Label')} />
                <NumberInput value={p.seconds} min={1} max={36000} onChange={(v) => set((d) => void (d.custom[i].seconds = v))} suffix="s" ariaLabel={t('u.seconds', 'seconds')} />
                <Select<IntervalPhase['kind']>
                  value={p.kind}
                  onChange={(v) => set((d) => void (d.custom[i].kind = v))}
                  ariaLabel={t('int.kind', 'Kind')}
                  options={[
                    { value: 'work', label: t('int.work', 'Work') },
                    { value: 'rest', label: t('int.rest', 'Rest') },
                    { value: 'long', label: t('int.long', 'Long break') },
                  ]}
                />
                <button type="button" className="mini-btn" aria-label={t('a.remove', 'Remove')} disabled={s.custom.length <= 1} onClick={() => set((d) => void d.custom.splice(i, 1))}>
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
          <Field label={t('int.repeat', 'Repeat')} inline>
            <NumberInput value={s.repeat} min={1} max={99} onChange={(v) => set((d) => void (d.repeat = Math.round(v)))} suffix="×" />
          </Field>
        </Section>
      )}
    </>
  );
}
