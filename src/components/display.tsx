import { memo, type CSSProperties, type ReactNode } from 'react';
import { useDeckCtx } from './deckCtx';

const FlipChar = memo(function FlipChar({ ch }: { ch: string }) {
  if (!/[0-9]/.test(ch)) return <span className="bt__sep">{ch}</span>;
  return (
    <span className="bt__card">
      <span key={ch} className="bt__card-face">
        {ch}
      </span>
    </span>
  );
});

/** Large time text; renders flip cards / LED ghosts depending on display style. */
export function BigTime({ text, className, size = 'xl', suffix, label }: { text: string; className?: string; size?: 'xl' | 'lg' | 'md' | 'sm'; suffix?: ReactNode; label?: string }) {
  const { appearance } = useDeckCtx();
  const style = appearance.style;
  let body: ReactNode = text;
  if (style === 'flip') {
    body = [...text].map((ch, i) => <FlipChar key={i + ':' + (/[0-9]/.test(ch) ? 'd' : ch)} ch={ch} />);
  } else if (style === 'led') {
    body = (
      <span className="bt__led">
        <span className="bt__ghost" aria-hidden>
          {text.replace(/[0-9]/g, '8')}
        </span>
        <span className="bt__lit">{text}</span>
      </span>
    );
  }
  return (
    <div className={`bt bt--${size} ${className ?? ''}`} role="timer" aria-label={label ?? text} style={{ '--chars': Math.max(3, text.replace(/[:.]/g, '').length + (text.match(/[:.]/g)?.length ?? 0) * 0.45) } as CSSProperties}>
      <span className="bt__digits" aria-hidden>
        {body}
      </span>
      {suffix && <span className="bt__suffix">{suffix}</span>}
    </div>
  );
}

export function ProgressRing({ value, size = '100%', thickness = 4, children, tone }: { value: number; size?: string; thickness?: number; children?: ReactNode; tone?: string }) {
  const r = 50 - thickness;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="ring" style={{ width: size, height: size } as CSSProperties} data-tone={tone}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle className="ring__track" cx="50" cy="50" r={r} strokeWidth={thickness} />
        <circle
          className="ring__bar"
          cx="50"
          cy="50"
          r={r}
          strokeWidth={thickness}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="ring__inner">{children}</div>
    </div>
  );
}

export function ProgressBar({ value, tone }: { value: number; tone?: string }) {
  return (
    <div className="pbar" data-tone={tone} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <div className="pbar__fill" style={{ transform: `scaleX(${Math.max(0, Math.min(1, value))})` }} />
    </div>
  );
}

export function AnalogClock({ h, m, s, ms = 0, showSeconds = true, small }: { h: number; m: number; s: number; ms?: number; showSeconds?: boolean; small?: boolean }) {
  const sec = s + ms / 1000;
  const minA = (m + sec / 60) * 6;
  const hourA = ((h % 12) + m / 60) * 30;
  const secA = sec * 6;
  return (
    <svg className={'analog' + (small ? ' analog--small' : '')} viewBox="0 0 200 200" aria-hidden>
      <circle className="analog__face" cx="100" cy="100" r="96" />
      {Array.from({ length: 60 }, (_, i) => {
        const major = i % 5 === 0;
        return (
          <line
            key={i}
            className={major ? 'analog__tick analog__tick--major' : 'analog__tick'}
            x1="100"
            y1={major ? 10 : 12}
            x2="100"
            y2={major ? 24 : 18}
            transform={`rotate(${i * 6} 100 100)`}
          />
        );
      })}
      <line className="analog__hour" x1="100" y1="112" x2="100" y2="54" transform={`rotate(${hourA} 100 100)`} />
      <line className="analog__min" x1="100" y1="116" x2="100" y2="28" transform={`rotate(${minA} 100 100)`} />
      {showSeconds && <line className="analog__sec" x1="100" y1="122" x2="100" y2="22" transform={`rotate(${secA} 100 100)`} />}
      <circle className="analog__pin" cx="100" cy="100" r="4" />
    </svg>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  const { appearance } = useDeckCtx();
  if (!appearance.showLabels) return null;
  return <div className={'d-label ' + (className ?? '')}>{children}</div>;
}
