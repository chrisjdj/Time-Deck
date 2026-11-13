import type { SoundKind } from '../types';

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Call from a user gesture so later sounds are allowed. */
export function unlockAudio() {
  ac();
}

function tone(c: AudioContext, freq: number, start: number, dur: number, vol: number, type: OscillatorType = 'sine', partials: number[] = [1]) {
  const g = c.createGain();
  g.connect(c.destination);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  partials.forEach((p, i) => {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = freq * p;
    const pg = c.createGain();
    pg.gain.value = 1 / (i + 1) ** 1.3;
    o.connect(pg).connect(g);
    o.start(start);
    o.stop(start + dur + 0.05);
  });
}

export type SoundEvent = 'end' | 'warn' | 'phase' | 'tick' | 'alarm';

export function playSound(kind: SoundKind, event: SoundEvent, volume: number) {
  const c = ac();
  if (!c || volume <= 0) return;
  const t = c.currentTime + 0.02;
  const v = volume * 0.5;
  const reps = event === 'end' || event === 'alarm' ? 3 : 1;
  const soft = event === 'warn' || event === 'tick';
  for (let r = 0; r < reps; r++) {
    const s = t + r * (kind === 'gong' ? 1.6 : 0.9);
    switch (kind) {
      case 'beep':
        tone(c, 880, s, 0.18, soft ? v * 0.6 : v, 'square');
        if (!soft) tone(c, 880, s + 0.25, 0.18, v, 'square');
        break;
      case 'gong':
        tone(c, 110, s, 2.8, v, 'sine', [1, 2.76, 5.4, 8.93]);
        break;
      case 'bell':
        tone(c, 1046.5, s, 1.4, v, 'sine', [1, 2.0, 3.0, 4.2]);
        break;
      case 'chime':
      default:
        if (event === 'phase') {
          tone(c, 659.25, s, 0.6, v);
          tone(c, 987.77, s + 0.18, 0.9, v);
        } else {
          tone(c, 523.25, s, 0.9, soft ? v * 0.6 : v, 'sine', [1, 2.01]);
          if (!soft) {
            tone(c, 659.25, s + 0.2, 0.9, v, 'sine', [1, 2.01]);
            tone(c, 783.99, s + 0.4, 1.2, v, 'sine', [1, 2.01]);
          }
        }
    }
  }
}

export function speak(text: string, locale: string, volume = 1) {
  try {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale;
    u.volume = Math.min(1, volume + 0.2);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

export async function notify(title: string, body: string) {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted' && document.visibilityState !== 'visible') {
      new Notification(title, { body, icon: './icons/icon-192.png', tag: 'time-deck' });
    }
  } catch {
    /* ignore */
  }
}

export async function requestNotifyPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}
