import { ImagePlus } from 'lucide-react';
import { Field, Section, Segmented, Toggle } from '../components/ui';
import { useT } from '../i18n';
import { useDeck } from '../store/deck';
import { saveImage } from '../lib/browser';
import type { Appearance, DisplayStyle, FontId } from '../types';

const STYLES: Array<{ id: DisplayStyle; name: string }> = [
  { id: 'minimal', name: 'Minimal' },
  { id: 'glass', name: 'Glass' },
  { id: 'neon', name: 'Neon' },
  { id: 'flip', name: 'Flip' },
  { id: 'led', name: 'LED' },
  { id: 'aurora', name: 'Aurora' },
  { id: 'contrast', name: 'High contrast' },
];

const ACCENTS = ['#7c5cff', '#3b82f6', '#06b6d4', '#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#e5e7eb'];

export function AppearancePanel() {
  const t = useT();
  const a = useDeck((s) => s.config.appearance);
  const update = useDeck((s) => s.update);
  const set = (fn: (d: Appearance) => void) => update((c) => fn(c.appearance));

  const onImage = async (f: File | undefined) => {
    if (!f) return;
    const id = 'bg-' + Date.now();
    await saveImage(id, f);
    set((d) => {
      d.bg = 'image';
      d.bgImageId = id;
    });
  };

  return (
    <>
      <Section title={t('ap.style', 'Display style')}>
        <div className="style-grid" role="radiogroup" aria-label={t('ap.style', 'Display style')}>
          {STYLES.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={a.style === s.id} className={'style-card' + (a.style === s.id ? ' is-active' : '')} onClick={() => set((d) => void (d.style = s.id))}>
              <span className={'style-card__swatch sw-' + s.id} aria-hidden>
                12:34
              </span>
              <span className="style-card__name">{t('st.' + s.id, s.name)}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title={t('ap.accent', 'Accent color')}>
        <div className="swatches">
          {ACCENTS.map((c) => (
            <button key={c} type="button" className={'swatch' + (a.accent.toLowerCase() === c ? ' is-active' : '')} style={{ background: c }} aria-label={c} onClick={() => set((d) => void (d.accent = c))} />
          ))}
          <label className="swatch swatch--custom" title={t('ap.custom', 'Custom color')}>
            <input type="color" value={a.accent} onChange={(e) => set((d) => void (d.accent = e.target.value))} aria-label={t('ap.custom', 'Custom color')} />
          </label>
        </div>
      </Section>
      <Section title={t('ap.type', 'Typography')}>
        <Segmented<FontId>
          value={a.font}
          onChange={(v) => set((d) => void (d.font = v))}
          label={t('ap.font', 'Font')}
          options={[
            { value: 'outfit', label: <span style={{ fontFamily: "'Outfit Variable'" }}>Outfit</span> },
            { value: 'inter', label: <span style={{ fontFamily: "'Inter Variable'" }}>Inter</span> },
            { value: 'grotesk', label: <span style={{ fontFamily: "'Space Grotesk Variable'" }}>Grotesk</span> },
            { value: 'mono', label: <span style={{ fontFamily: "'JetBrains Mono Variable'" }}>Mono</span> },
          ]}
        />
        <Field label={`${t('ap.size', 'Size')} · ${Math.round(a.scale * 100)}%`}>
          <input type="range" className="range" min={0.6} max={1.4} step={0.05} value={a.scale} onChange={(e) => set((d) => void (d.scale = parseFloat(e.target.value)))} />
        </Field>
      </Section>
      <Section title={t('ap.bg', 'Background')}>
        <Segmented<Appearance['bg']>
          value={a.bg}
          onChange={(v) => set((d) => void (d.bg = v))}
          options={[
            { value: 'style', label: t('ap.bgStyle', 'Style') },
            { value: 'solid', label: t('ap.bgSolid', 'Solid') },
            { value: 'gradient', label: t('ap.bgGradient', 'Gradient') },
            { value: 'image', label: t('ap.bgImage', 'Image') },
          ]}
        />
        {(a.bg === 'solid' || a.bg === 'gradient') && (
          <div className="color-row">
            <input type="color" value={a.bgColor} onChange={(e) => set((d) => void (d.bgColor = e.target.value))} aria-label={t('ap.color1', 'Color 1')} />
            {a.bg === 'gradient' && <input type="color" value={a.bgColor2} onChange={(e) => set((d) => void (d.bgColor2 = e.target.value))} aria-label={t('ap.color2', 'Color 2')} />}
          </div>
        )}
        {a.bg === 'image' && (
          <label className="btn btn--ghost file-btn">
            <ImagePlus size={16} /> {a.bgImageId ? t('ap.replace', 'Replace image') : t('ap.upload', 'Choose image')}
            <input type="file" accept="image/*" onChange={(e) => void onImage(e.target.files?.[0])} />
          </label>
        )}
        {a.bg === 'image' && <p className="muted small">{t('ap.imageHint', 'Stored only in this browser. Not included in share links.')}</p>}
      </Section>
      <Section title={t('o.options', 'Options')}>
        <Toggle checked={a.hour12} onChange={(v) => set((d) => void (d.hour12 = v))} label={t('ap.h12', '12-hour clock (AM/PM)')} />
        <Toggle checked={a.showLabels} onChange={(v) => set((d) => void (d.showLabels = v))} label={t('ap.labels', 'Show labels & secondary text')} />
        <Toggle checked={a.touchMode} onChange={(v) => set((d) => void (d.touchMode = v))} label={t('ap.touch', 'Large touch controls')} hint={t('ap.touchHint', 'Always-visible big buttons and swipe between modes on the display')} />
        <Toggle checked={a.pixelShift} onChange={(v) => set((d) => void (d.pixelShift = v))} label={t('ap.shift', 'Burn-in protection')} hint={t('ap.shiftHint', 'Moves the content a few pixels every minute (TVs, OLED)')} />
      </Section>
    </>
  );
}
