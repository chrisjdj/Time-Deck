import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useT } from '../i18n';

export function HelpOverlay({ onClose }: { onClose: () => void }) {
  const t = useT();
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [onClose]);
  const rows: Array<[string, string]> = [
    ['Space', t('k.toggle', 'Start / pause')],
    ['R', t('k.reset', 'Reset')],
    ['L', t('k.lap', 'Lap (stopwatch)')],
    ['↑ / ↓', t('k.adjust', 'Add / remove one minute')],
    ['N / P', t('k.next', 'Next / previous segment or interval')],
    ['PgDn / PgUp', t('k.clicker', 'Presentation clicker: next / back (or start / pause)')],
    ['F', t('k.fullscreen', 'Toggle full screen')],
    ['T', t('k.theme', 'Toggle light / dark')],
    ['H', t('k.hour', 'Switch 12h (AM/PM) / 24h')],
    ['Esc', t('k.exit', 'Leave the display')],
    ['?', t('k.help', 'Show this help')],
  ];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(e) => e.stopPropagation()}>
        <header className="modal__head">
          <h2 id="help-title">{t('k.title', 'Keyboard shortcuts')}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('a.close', 'Close')} autoFocus>
            <X size={18} />
          </button>
        </header>
        <dl className="kbd-list">
          {rows.map(([k, d]) => (
            <div key={k}>
              <dt>
                {k.split(' / ').map((x, i) => (
                  <span key={x}>
                    {i > 0 && ' / '}
                    <kbd>{x}</kbd>
                  </span>
                ))}
              </dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
