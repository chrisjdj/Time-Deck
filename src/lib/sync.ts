/**
 * Cross-window sync. Every window can change state (last write wins).
 * BroadcastChannel primary; localStorage 'storage' events as fallback.
 */
type StateListener = (state: unknown) => void;

const WINDOW_ID = Math.random().toString(36).slice(2);
const CHANNEL = 'time-deck';
const FALLBACK_KEY = 'time-deck:msg';

interface Msg {
  from: string;
  type: 'state' | 'ping';
  role?: string;
  state?: unknown;
}

let bc: BroadcastChannel | null = null;
try {
  bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
} catch {
  bc = null;
}

const stateListeners = new Set<StateListener>();
let lastDisplayPing = 0;

function handle(msg: Msg) {
  if (!msg || msg.from === WINDOW_ID) return;
  if (msg.type === 'state') stateListeners.forEach((l) => l(msg.state));
  if (msg.type === 'ping' && msg.role === 'display') lastDisplayPing = Date.now();
}

if (bc) bc.onmessage = (e) => handle(e.data as Msg);
else if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== FALLBACK_KEY || !e.newValue) return;
    try {
      handle(JSON.parse(e.newValue) as Msg);
    } catch {
      /* ignore */
    }
  });
}

function post(msg: Msg) {
  if (bc) {
    try {
      bc.postMessage(msg);
    } catch {
      /* non-cloneable */
    }
    return;
  }
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify({ ...msg, t: Date.now() }));
  } catch {
    /* ignore */
  }
}

let role: 'dashboard' | 'display' = 'dashboard';

export const sync = {
  id: WINDOW_ID,
  postState(state: unknown) {
    post({ from: WINDOW_ID, type: 'state', state });
  },
  onState(fn: StateListener) {
    stateListeners.add(fn);
    return () => stateListeners.delete(fn);
  },
  setRole(r: 'dashboard' | 'display') {
    role = r;
  },
  get role() {
    return role;
  },
  /** Display windows announce themselves so the dashboard can stay quiet (no double sounds). */
  startHeartbeat() {
    const tick = () => post({ from: WINDOW_ID, type: 'ping', role });
    tick();
    const h = window.setInterval(tick, 2000);
    return () => clearInterval(h);
  },
  displayAlive() {
    return Date.now() - lastDisplayPing < 5000;
  },
  /** True when this window should play sounds / notifications / alarm checks. */
  isLeader() {
    return role === 'display' || !this.displayAlive();
  },
};
