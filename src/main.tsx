import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/outfit';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';
import './styles/main.scss';
import App from './App';
import flagFontUrl from 'country-flag-emoji-polyfill/dist/TwemojiCountryFlags.woff2?url';

// Windows has no colour flag emoji: register a bundled flag-only font (used only for
// regional-indicator characters thanks to unicode-range, so other text is unaffected).
try {
  const ff = new FontFace('Twemoji Country Flags', `url(${flagFontUrl}) format('woff2')`, {
    unicodeRange: 'U+1F1E6-1F1FF, U+1F3F4, U+E0062-E0063, U+E0065, U+E0067, U+E006C, U+E006E, U+E0073-E0074, U+E0077, U+E007F',
    display: 'swap',
  });
  document.fonts.add(ff);
} catch {
  /* FontFace unsupported: native emoji fallback */
}
import { decodeConfig, parseDisplayParams } from './lib/share';
import { enterIsolatedMode } from './store/deck';

// Share / embed links carry their own config and run detached from local storage + sync.
function bootFromHash(hash: string) {
  if (!hash.startsWith('#/display')) return;
  const p = parseDisplayParams(hash.split('?')[1] ?? '');
  if (!p.s) return;
  const cfg = decodeConfig(p.s);
  if (cfg) enterIsolatedMode(cfg);
}
bootFromHash(location.hash);
window.addEventListener('hashchange', () => {
  // A different share link pasted into the same tab: reload to boot cleanly.
  if (/[?&]s=/.test(location.hash) && location.hash.startsWith('#/display')) location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
