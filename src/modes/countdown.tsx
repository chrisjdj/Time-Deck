import { BigTime, Label, ProgressRing } from '../components/display';
import { DurationInput, Field, NumberInput, Section, Toggle } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { useT } from '../i18n';
import { elapsed, formatCountdown, MIN, urgency } from '../lib/time';
import { actions } from '../store/actions';
import { useModeSettings, type DisplayProps } from './common';

export function Display({ config }: DisplayProps) {
  const s = config.settings.countdown;
  const run = config.runtime.countdown;
  const t = useT();
  const now = useNow(run.status === 'running' ? (s.showTenths ? 'frame' : 'fast') : 'second');
  const e = elapsed(run, now);
  const remaining = s.durationMs - e;
  const over = remaining <= 0;
  const tone = run.status === 'idle' ? 'ok' : urgency(remaining, s.warnAtSec, s.dangerAtSec);
  const text = over ? (s.overtime && run.status !== 'idle' ? '+' + formatCountdown(-remaining) : formatCountdown(0)) : formatCountdown(remaining, { tenths: s.showTenths });
  const progress = s.durationMs > 0 ? Math.min(1, Math.max(0, remaining / s.durationMs)) : 0;
  const status =
    run.status === 'paused' ? t('st.paused', 'Paused') : over && run.status === 'running' ? t('sig.timeUp', "Time's up") : run.status === 'idle' ? t('st.ready', 'Ready') : '';

  const body = (
    <>
      {s.title && <div className="d-title">{s.title}</div>}
      <BigTime text={text} className={over && run.status === 'running' ? 'is-over' : ''} />
      <Label className={'d-status' + (run.status === 'paused' ? ' is-blink' : '')}>{status || ' '}</Label>
    </>
  );

  return (
    <div className="m-countdown" data-tone={tone}>
      {s.showProgress ? (
        <ProgressRing value={over ? 0 : progress} tone={tone} thickness={2.2}>
          {body}
        </ProgressRing>
      ) : (
        <div className="m-countdown__plain">{body}</div>
      )}
    </div>
  );
}

const QUICK = [1, 2, 3, 5, 10, 15, 20, 30, 45, 60, 90];

export function Settings() {
  const t = useT();
  const [s, set] = useModeSettings('countdown');
  return (
    <>
      <Section title={t('cd.duration', 'Duration')}>
        <DurationInput ms={s.durationMs} onChange={(ms) => actions.setCountdown(ms)} ariaLabel={t('cd.duration', 'Duration')} />
        <div className="chips">
          {QUICK.map((m) => (
            <button key={m} type="button" className={'chip' + (s.durationMs === m * MIN ? ' is-active' : '')} onClick={() => actions.setCountdown(m * MIN)}>
              {m < 60 ? `${m}m` : `${m / 60}h`.replace('1.5h', '1h30')}
            </button>
          ))}
        </div>
        <Field label={t('cd.title', 'Title (optional)')}>
          <input className="text-input" value={s.title} maxLength={60} onChange={(e) => set((d) => void (d.title = e.target.value))} placeholder={t('cd.titlePh', 'e.g. Break ends in')} />
        </Field>
      </Section>
      <Section title={t('cd.alerts', 'Colors & alerts')}>
        <Field label={t('cd.warnAt', 'Turn amber at')} inline>
          <NumberInput value={s.warnAtSec} min={0} max={36000} onChange={(v) => set((d) => void (d.warnAtSec = v))} suffix={t('u.sec', 'sec')} />
        </Field>
        <Field label={t('cd.dangerAt', 'Turn red at')} inline>
          <NumberInput value={s.dangerAtSec} min={0} max={36000} onChange={(v) => set((d) => void (d.dangerAtSec = v))} suffix={t('u.sec', 'sec')} />
        </Field>
        <Toggle checked={s.overtime} onChange={(v) => set((d) => void (d.overtime = v))} label={t('cd.overtime', 'Count overtime')} hint={t('cd.overtimeHint', 'Keep counting up after zero')} />
      </Section>
      <Section title={t('o.display', 'Display')}>
        <Toggle checked={s.showProgress} onChange={(v) => set((d) => void (d.showProgress = v))} label={t('cd.ring', 'Progress ring')} />
        <Toggle checked={s.showTenths} onChange={(v) => set((d) => void (d.showTenths = v))} label={t('cd.tenths', 'Show tenths of a second')} />
      </Section>
    </>
  );
}
