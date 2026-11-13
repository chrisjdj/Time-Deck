import { unlockAudio } from './audio';

/** Open (or focus) the synced second display window, e.g. for a TV or projector. */
export function openDisplayWindow() {
  unlockAudio();
  const url = location.href.split('#')[0] + '#/display';
  window.open(url, 'time-deck-display', 'popup=yes,width=1280,height=720');
}

/** Switch this tab to the display and go full screen. */
export function presentHere() {
  unlockAudio();
  location.hash = '#/display';
  void document.documentElement.requestFullscreen?.().catch(() => {});
}
