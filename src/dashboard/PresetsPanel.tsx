import { Check, Copy, Download, FolderOpen, Link2, MonitorPlay, Save, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Section } from '../components/ui';
import { useT } from '../i18n';
import { useDeck } from '../store/deck';
import { buildDisplayUrl } from '../lib/share';
import { copyText, download } from '../lib/browser';
import { uid } from '../lib/time';
import { normalizeConfig } from '../store/defaults';
import { MODE_MAP } from '../modes';
import type { Preset } from '../types';

function CopyField({ value, label }: { value: string; label: string }) {
  const t = useT();
  const [ok, setOk] = useState(false);
  return (
    <div className="copy-field">
      <input className="text-input mono" readOnly value={value} aria-label={label} onFocus={(e) => e.target.select()} />
      <button
        type="button"
        className="btn"
        onClick={async () => {
          setOk(await copyText(value));
          setTimeout(() => setOk(false), 1500);
        }}
      >
        {ok ? <Check size={16} /> : <Copy size={16} />} {ok ? t('a.copied', 'Copied') : t('a.copy', 'Copy')}
      </button>
    </div>
  );
}

export function SharePanel() {
  const t = useT();
  const config = useDeck((s) => s.config);
  const shareUrl = buildDisplayUrl(config);
  const overlayUrl = buildDisplayUrl(config, { embed: true, transparent: true });
  const [qr, setQr] = useState('');
  const local = location.protocol === 'file:' || /^(localhost|127\.)/.test(location.hostname);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(shareUrl, { margin: 1, width: 360, errorCorrectionLevel: 'L' })
      .then((u) => alive && setQr(u))
      .catch(() => alive && setQr(''));
    return () => {
      alive = false;
    };
  }, [shareUrl]);
  return (
    <>
      <Section title={t('sh.link', 'Share link')}>
        <p className="muted small">{t('sh.linkHint', 'Opens this exact display (mode, settings and look) on any device. Timers start fresh.')}</p>
        <CopyField value={shareUrl} label={t('sh.link', 'Share link')} />
        {qr && (
          <div className="qr">
            <img src={qr} alt={t('sh.qr', 'QR code for the share link')} width={180} height={180} />
            <span className="muted small">{t('sh.qrHint', 'Scan to open on a phone or tablet')}</span>
          </div>
        )}
        {local && <p className="warn-note small">{t('sh.local', 'You are running locally, so this link only works on this computer.')}</p>}
      </Section>
      <Section title={t('sh.obs', 'Stream overlay (OBS)')}>
        <p className="muted small">{t('sh.obsHint', 'Transparent background, no controls. In OBS add a “Browser” source, paste the URL, and set width 1920 × height 1080. Optional: &scale=0.5, &align=left|right|top|bottom, &color=%23ff0000.')}</p>
        <CopyField value={overlayUrl} label={t('sh.obs', 'Stream overlay (OBS)')} />
        <a className="btn btn--ghost" href={overlayUrl} target="_blank" rel="noreferrer">
          <MonitorPlay size={16} /> {t('sh.preview', 'Preview overlay')}
        </a>
      </Section>
    </>
  );
}

export function PresetsPanel() {
  const t = useT();
  const presets = useDeck((s) => s.presets);
  const config = useDeck((s) => s.config);
  const patch = useDeck((s) => s.patch);
  const replace = useDeck((s) => s.replaceConfig);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 2000);
  };

  const save = () => {
    const n = name.trim() || `${MODE_MAP[config.mode].label(t)} ${new Date().toLocaleDateString()}`;
    const existing = presets.find((p) => p.name === n);
    const p: Preset = { id: existing?.id ?? uid(), name: n, savedAt: Date.now(), config: structuredClone(config) };
    patch({ presets: existing ? presets.map((x) => (x.id === existing.id ? p : x)) : [p, ...presets] });
    setName('');
    flash(t('ps.saved', 'Saved “{n}”', { n }));
  };

  const importFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const list: Preset[] = (Array.isArray(data) ? data : data.presets ?? []).map((p: Preset) => ({
        id: uid(),
        name: String(p.name ?? 'Imported'),
        savedAt: Number(p.savedAt) || Date.now(),
        config: normalizeConfig(p.config),
      }));
      patch({ presets: [...list, ...presets] });
      flash(t('ps.imported', 'Imported {n} presets', { n: list.length }));
    } catch {
      flash(t('ps.bad', 'That file is not a Time-Deck preset export'));
    }
  };

  return (
    <>
      <Section title={t('ps.save', 'Save current setup')}>
        <div className="input-row">
          <input className="text-input" value={name} maxLength={50} placeholder={t('ps.name', 'Preset name')} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
          <button type="button" className="btn btn--primary" onClick={save}>
            <Save size={16} /> {t('a.save', 'Save')}
          </button>
        </div>
        {msg && (
          <p className="ok-note small" role="status">
            {msg}
          </p>
        )}
      </Section>
      <Section title={t('ps.saved2', 'Saved presets')}>
        {presets.length === 0 ? (
          <p className="muted small">{t('ps.none', 'No presets yet. Save one above to switch setups in one click.')}</p>
        ) : (
          <ul className="preset-list">
            {presets.map((p) => {
              const M = MODE_MAP[p.config.mode];
              const Icon = M?.icon;
              return (
                <li key={p.id}>
                  {Icon && <Icon size={16} aria-hidden />}
                  <span className="preset-list__name">
                    {p.name}
                    <small>{M?.label(t)}</small>
                  </span>
                  <button
                    type="button"
                    className="btn btn--sm"
                    onClick={() => {
                      replace(p.config);
                      flash(t('ps.loaded', 'Loaded “{n}”', { n: p.name }));
                    }}
                  >
                    <FolderOpen size={14} /> {t('a.load', 'Load')}
                  </button>
                  <button type="button" className="mini-btn" aria-label={t('ps.copyLink', 'Copy link')} title={t('ps.copyLink', 'Copy link')} onClick={() => void copyText(buildDisplayUrl(p.config)).then(() => flash(t('a.copied', 'Copied')))}>
                    <Link2 size={14} />
                  </button>
                  <button type="button" className="mini-btn" aria-label={t('a.remove', 'Remove')} onClick={() => patch({ presets: presets.filter((x) => x.id !== p.id) })}>
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="btn-row">
          <button type="button" className="btn btn--ghost" disabled={!presets.length} onClick={() => download('time-deck-presets.json', JSON.stringify({ app: 'time-deck', v: 1, presets }, null, 2), 'application/json')}>
            <Download size={16} /> {t('ps.export', 'Export')}
          </button>
          <label className="btn btn--ghost file-btn">
            <Upload size={16} /> {t('ps.import', 'Import')}
            <input type="file" accept="application/json,.json" onChange={(e) => void importFile(e.target.files?.[0])} />
          </label>
        </div>
      </Section>
    </>
  );
}
