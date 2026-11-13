import { useState } from 'react';
import { BigTime, Label, ProgressBar } from '../components/display';
import { Field, NumberInput, Section, Segmented, Toggle } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { useT } from '../i18n';
import { formatCountdown, MIN } from '../lib/time';
import { examState } from '../lib/sequence';
import { localTz, timeText } from '../lib/tz';
import { useModeSettings, type DisplayProps } from './common';

export function Display({ config }: DisplayProps) {
  const s = config.settings.exam;
  const run = config.runtime.exam;
  const t = useT();
  const now = useNow(run.status === 'running' || s.kind === 'scheduled' ? 'fast' : 'second');
  const st = examState(s, run, now);
  const h12 = config.appearance.hour12;
  const tz = localTz();
  const clock = timeText(now, tz, h12);
  const fmtT = (ep: number | null) => {
    if (!ep) return '—';
    const x = timeText(ep, tz, h12);
    return `${x.hm}${x.period ? ' ' + x.period : ''}`;
  };
  const tone = st.phase === 'writing' ? (st.remaining <= 5 * MIN ? 'danger' : st.remaining <= 15 * MIN ? 'warn' : 'ok') : st.phase === 'finished' ? 'over' : 'ok';
  const heading: Record<typeof st.phase, string> = {
    ready: t('exam.ready', 'Ready to start'),
    before: t('exam.startsIn', 'Starts in'),
    reading: t('exam.reading', 'Reading time'),
    writing: t('exam.remaining', 'Time remaining'),
    finished: t('exam.finished', 'Finished'),
  };
  const mins = Math.ceil(st.remaining / MIN);
  return (
    <div className="m-exam" data-tone={tone}>
      <div className="m-exam__head">
        <div className="d-title">{s.title}</div>
        {s.showClock && (
          <div className="m-exam__clock" aria-label={t('exam.now', 'Current time')}>
            {clock.hm}
            {clock.period && <small> {clock.period}</small>}
          </div>
        )}
      </div>
      <div className="m-exam__body">
        <div className="m-exam__timer">
          <Label className="d-status">{run.status === 'paused' ? t('st.paused', 'Paused') : heading[st.phase]}</Label>
          {st.phase === 'finished' ? (
            <div className="m-exam__stop">{t('exam.stopShort', 'Pens down')}</div>
          ) : st.phase === 'writing' && st.remaining > 10 * MIN ? (
            <BigTime text={`${mins}`} suffix={t('u.min', 'min')} label={`${mins} ${t('u.minutes', 'minutes')}`} />
          ) : (
            <BigTime text={formatCountdown(st.remaining)} />
          )}
          <ProgressBar value={st.writingTotal ? 1 - st.writingElapsed / st.writingTotal : 1} tone={tone} />
          <div className="m-exam__times">
            <span>
              {t('exam.start', 'Start')} <b>{fmtT(st.startsAt)}</b>
            </span>
            <span>
              {t('exam.end', 'End')} <b>{fmtT(st.endsAt)}</b>
            </span>
          </div>
        </div>
        {s.notice.trim() && <div className="m-exam__notice">{s.notice}</div>}
      </div>
    </div>
  );
}

export function Settings() {
  const t = useT();
  const [s, set] = useModeSettings('exam');
  const [ms, setMs] = useState(s.milestones.join(', '));
  return (
    <>
      <Section title={t('exam.exam', 'Exam')}>
        <Field label={t('ev.title', 'Title')}>
          <input className="text-input" value={s.title} maxLength={80} onChange={(e) => set((d) => void (d.title = e.target.value))} />
        </Field>
        <Segmented
          value={s.kind}
          onChange={(v) => set((d) => void (d.kind = v))}
          options={[
            { value: 'manual', label: t('exam.manual', 'Start manually') },
            { value: 'scheduled', label: t('exam.scheduled', 'Fixed times') },
          ]}
        />
        {s.kind === 'manual' ? (
          <Field label={t('exam.duration', 'Writing time')} inline>
            <NumberInput value={s.durationMin} min={1} max={720} onChange={(v) => set((d) => void (d.durationMin = v))} suffix="min" />
          </Field>
        ) : (
          <div className="grid-2">
            <Field label={t('exam.start', 'Start')}>
              <input className="text-input" type="time" value={s.start} onChange={(e) => set((d) => void (d.start = e.target.value))} />
            </Field>
            <Field label={t('exam.end', 'End')}>
              <input className="text-input" type="time" value={s.end} onChange={(e) => set((d) => void (d.end = e.target.value))} />
            </Field>
          </div>
        )}
        <Field label={t('exam.readingTime', 'Reading time before start')} inline>
          <NumberInput value={s.readingMin} min={0} max={60} onChange={(v) => set((d) => void (d.readingMin = v))} suffix="min" />
        </Field>
      </Section>
      <Section title={t('exam.milestones', 'Announcements')}>
        <Field label={t('exam.milestonesLbl', 'Announce minutes remaining')} hint={t('exam.milestonesHint', 'Comma separated, e.g. 30, 10, 5')}>
          <input
            className="text-input"
            value={ms}
            onChange={(e) => setMs(e.target.value)}
            onBlur={() =>
              set((d) => {
                d.milestones = Array.from(new Set(ms.split(/[,\s]+/).map(Number).filter((n) => n > 0 && n < 1000))).sort((a, b) => b - a);
                setMs(d.milestones.join(', '));
              })
            }
          />
        </Field>
        <Toggle checked={s.showClock} onChange={(v) => set((d) => void (d.showClock = v))} label={t('pr.clock', 'Show current time')} />
      </Section>
      <Section title={t('exam.notice', 'Notice board')}>
        <textarea className="text-input" rows={5} value={s.notice} maxLength={600} onChange={(e) => set((d) => void (d.notice = e.target.value))} placeholder={t('exam.noticePh', 'Rules, room number, allowed materials…')} />
      </Section>
    </>
  );
}
