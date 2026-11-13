/** Fullscreen, wake lock, idb image store, clipboard and download helpers. */

export function isFullscreen(): boolean {
  return !!document.fullscreenElement;
}

export async function toggleFullscreen(el: HTMLElement = document.documentElement) {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen({ navigationUI: 'hide' });
  } catch {
    /* not allowed */
  }
}

type WakeLockSentinelLike = { release: () => Promise<void>; released: boolean };
let lock: WakeLockSentinelLike | null = null;
let wantLock = false;

async function acquire() {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinelLike> } }).wakeLock;
    if (!wl || document.visibilityState !== 'visible') return;
    if (lock && !lock.released) return;
    lock = await wl.request('screen');
  } catch {
    lock = null;
  }
}

function onVisible() {
  if (wantLock && document.visibilityState === 'visible') void acquire();
}

export function keepAwake(on: boolean) {
  wantLock = on;
  if (on) {
    void acquire();
    document.addEventListener('visibilitychange', onVisible);
  } else {
    document.removeEventListener('visibilitychange', onVisible);
    void lock?.release().catch(() => {});
    lock = null;
  }
}

export function wakeLockSupported(): boolean {
  return 'wakeLock' in navigator;
}

// ---- IndexedDB blob store for background images ----
const DB = 'time-deck';
const STORE = 'images';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveImage(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export async function loadImage(id: string): Promise<Blob | null> {
  try {
    const db = await openDb();
    return await new Promise((res) => {
      const req = db.transaction(STORE).objectStore(STORE).get(id);
      req.onsuccess = () => res((req.result as Blob) ?? null);
      req.onerror = () => res(null);
    });
  } catch {
    return null;
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export function download(name: string, text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
