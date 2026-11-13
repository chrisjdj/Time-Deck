import { Suspense, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { DeckConfig } from '../types';
import { MODE_MAP } from '../modes';
import { DeckCtx } from './deckCtx';
import { useNow } from '../hooks/useNow';
import { loadImage } from '../lib/browser';
import type { DisplayParams } from '../lib/share';

const FONTS: Record<string, string> = {
  inter: "'Inter Variable', system-ui, sans-serif",
  outfit: "'Outfit Variable', system-ui, sans-serif",
  grotesk: "'Space Grotesk Variable', system-ui, sans-serif",
  mono: "'JetBrains Mono Variable', ui-monospace, monospace",
};

function useBgImage(id: string): string | null {
  const [img, setImg] = useState<{ id: string; url: string } | null>(null);
  useEffect(() => {
    if (!id) return;
    let alive = true;
    let obj: string | null = null;
    void loadImage(id).then((b) => {
      if (!alive || !b) return;
      obj = URL.createObjectURL(b);
      setImg({ id, url: obj });
    });
    return () => {
      alive = false;
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [id]);
  return img && img.id === id ? img.url : null;
}

function PixelShift({ on, children }: { on: boolean; children: ReactNode }) {
  const now = useNow('minute');
  const m = Math.floor(now / 60000);
  const dx = on ? ((m * 7) % 13) - 6 : 0;
  const dy = on ? ((m * 5) % 9) - 4 : 0;
  return (
    <div className="deck__stage" style={on ? { transform: `translate(${dx}px, ${dy}px)` } : undefined}>
      {children}
    </div>
  );
}

export function DeckView({ config, preview = false, params }: { config: DeckConfig; preview?: boolean; params?: Partial<DisplayParams> }) {
  const a = config.appearance;
  const mode = MODE_MAP[config.mode] ?? MODE_MAP.clock;
  const Display = mode.Display;
  const img = useBgImage(a.bg === 'image' ? a.bgImageId : '');
  const embed = !!params?.embed;
  const transparent = !!params?.transparent;

  const style: Record<string, string | number> = {
    '--accent': params?.color || a.accent,
    '--scale': (params?.scale ?? 1) * a.scale,
    '--d-font': FONTS[a.font] ?? FONTS.outfit,
  };
  if (!transparent) {
    if (a.bg === 'solid') style['--d-bg-override'] = a.bgColor;
    if (a.bg === 'gradient') style['--d-bg-override'] = `linear-gradient(135deg, ${a.bgColor}, ${a.bgColor2})`;
    if (a.bg === 'image' && img) style['--d-bg-override'] = `center / cover no-repeat url("${img}")`;
  }

  return (
    <DeckCtx.Provider value={{ appearance: a, preview, embed }}>
      <div
        className={'deck' + (preview ? ' deck--preview' : '') + (transparent ? ' deck--transparent' : '') + (a.bg !== 'style' && !transparent ? ' deck--custom-bg' : '')}
        data-style={a.style}
        data-mode={config.mode}
        data-align={params?.align ?? 'center'}
        style={style as CSSProperties}
      >
        {!transparent && (a.style === 'aurora' || a.style === 'glass') && a.bg === 'style' && (
          <div className="deck__fx" aria-hidden>
            <span />
            <span />
            <span />
          </div>
        )}
        <PixelShift on={a.pixelShift && !preview}>
          <Suspense fallback={<div className="deck__loading" />}>
            <Display config={config} />
          </Suspense>
        </PixelShift>
      </div>
    </DeckCtx.Provider>
  );
}
