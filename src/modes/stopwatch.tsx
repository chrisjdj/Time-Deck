import { Download, Trash2 } from 'lucide-react';
import { BigTime, Label } from '../components/display';
import { Section, Toggle } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { useT } from '../i18n';
import { elapsed, formatStopwatch, lapRows, lapsCsv } from '../lib/time';
import { download } from '../lib/browser';
import { useDeck } from '../store/deck';
import { useModeSettings, type DisplayProps } from './common';

export function Display({ config }: DisplayProps) {
  const run = config.runtime.stopwatch;
  const t = useT();
  const now = useNow(run.status === 'running' ? 'frame' : 'second');
  const e = elapsed(run, now);
  const rows = lapRows(run.laps).reverse();
  const showLaps = config.settings.stopwatch.showLaps && rows.length > 0;
  const currentLap = e - (run.laps.at(-1) ?? 0);
  return (
    <div className={'m-stopwatch' + (showLaps ? ' has-laps' : '')}>
      <div className="m-stopwatch__main">
        <BigTime text={formatStopwatch(e)} />
        {showLaps ? (
          <Label className="d-status">
            {t('sw.lap', 'Lap')} {run.laps.length + 1} · {formatStopwatch(currentLap)}
          </Label>
        ) : (
          <Label className={'d-status' + (run.status === 'paused' ? ' is-blink' : '')}>{run.status === 'paused' ? t('st.paused', 'Paused') : ' '}</Label>
        )}
      </div>
      {showLaps && (
        <div className="laps" role="table" aria-label={t('sw.laps', 'Laps')}>
          <div className="laps__row laps__head" role="row">
            <span role="columnheader">#</span>
            <span role="columnheader">{t('sw.lapTime', 'Lap time')}</span>
            <span role="columnheader">{t('sw.split', 'Split')}</span>
          </div>
          {rows.slice(0, 50).map((r) => (
            <div key={r.index} role="row" className={'laps__row' + (r.best ? ' is-best' : '') + (r.worst ? ' is-worst' : '')}>
              <span role="cell">{r.index}</span>
              <span role="cell">{formatStopwatch(r.lap)}</span>
              <span role="cell">{formatStopwatch(r.split)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Settings() {
  const t = useT();
  const [s, set] = useModeSettings('stopwatch');
  const laps = useDeck((st) => st.config.runtime.stopwatch.laps);
  const update = useDeck((st) => st.update);
  return (
    <>
      <Section title={t('sw.laps', 'Laps')}>
        <Toggle checked={s.showLaps} onChange={(v) => set((d) => void (d.showLaps = v))} label={t('sw.showLaps', 'Show lap table')} hint={t('sw.lapHint', 'Press L to record a lap')} />
        <p className="muted small">{t('sw.count', '{n} laps recorded', { n: laps.length })}</p>
        <div className="btn-row">
          <button type="button" className="btn" disabled={!laps.length} onClick={() => download('laps.csv', lapsCsv(laps), 'text/csv')}>
            <Download size={16} /> {t('sw.export', 'Export CSV')}
          </button>
          <button type="button" className="btn btn--ghost" disabled={!laps.length} onClick={() => update((c) => void (c.runtime.stopwatch.laps = []))}>
            <Trash2 size={16} /> {t('sw.clear', 'Clear laps')}
          </button>
        </div>
      </Section>
    </>
  );
}
