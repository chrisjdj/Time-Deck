import { useEffect, useState } from 'react';

export type Rate = 'frame' | 'fast' | 'second' | 'minute';

/**
 * Current epoch, re-rendering at the given rate.
 *  frame  – every animation frame (stopwatch centiseconds)
 *  fast   – every 100ms (countdowns: anchor-relative seconds never lag > 0.1s)
 *  second – aligned to wall-clock second boundaries
 *  minute – aligned to wall-clock minute boundaries
 */
export function useNow(rate: Rate = 'second'): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let raf = 0;
    let timer = 0;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      const n = Date.now();
      setNow(n);
      if (rate === 'frame') raf = requestAnimationFrame(tick);
      else if (rate === 'fast') timer = window.setTimeout(tick, 100);
      else {
        const unit = rate === 'second' ? 1000 : 60000;
        timer = window.setTimeout(tick, unit - (n % unit) + 5);
      }
    };
    tick();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [rate]);
  return now;
}
