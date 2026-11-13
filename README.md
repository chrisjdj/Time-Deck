# Time-Deck

Full-screen clocks, timers and world time, set up from a dashboard and shown on any screen. It runs entirely in the browser: no server, no account, and it works offline as a PWA.

**Live:** https://chrisjdj.github.io/web-tools/Time-Deck/

## Modes

| Group | Mode | What it does |
|---|---|---|
| Clocks | Clock | Digital or analog, seconds and date, any city, optional UTC / ISO week / Unix time |
| | World clocks | Up to 12 cities in an auto grid, offset vs local time, tomorrow/yesterday, day/night tint, sunrise & sunset |
| | World map | Live day/night terminator, subsolar point and city pins (computed offline) |
| | Meeting planner | 24h strips per city with working hours, overlap highlight, click-to-select + copy, time converter |
| Timers | Countdown | Duration with quick chips, progress ring, amber/red thresholds, overtime count-up |
| | Event countdown | Days/hours/minutes to a date in any time zone, then "time since" |
| | Stopwatch | Centiseconds, laps with lap/split, best/worst highlight, CSV export |
| | Presenter | Agenda segments, colour thresholds, overtime flash, live messages to the speaker |
| | Pomodoro / intervals | Pomodoro sets or custom HIIT-style intervals with repeat |
| | Multi-timer | Up to 12 independent countdowns/stopwatches, tap a tile to start/pause |
| | Exam / classroom | Manual or fixed start/end, reading time, spoken milestones, notice board |
| Fun | Word clock · Binary clock · Progress (day/week/month/year) · Moon phase | |

Alarms and "remind me in X" reminders work on top of any mode. They ring only while a Time-Deck tab is open.

## Display

- **Present** switches the current tab to full screen. **Open display window** opens a second window (TV or projector) that stays in sync through `BroadcastChannel`, with a `localStorage` fallback.
- 7 display styles: Minimal, Glass, Neon, Flip, LED, Aurora and High contrast. Each works in light and dark, with an accent colour, 4 bundled fonts, a size slider, and a solid, gradient or image background.
- Screen Wake Lock, cursor and controls auto-hide, burn-in pixel shift, large-touch mode with swipe between modes.
- Keyboard: `Space` start/pause · `R` reset · `L` lap · `↑/↓` ±1 min · `N/P` next/previous · `PgDn/PgUp` presentation clicker · `F` full screen · `T` theme · `H` 12h/24h · `?` help.

## Sharing

- **Share link:** the whole setup is compressed into `#/display?s=…`. The link opens isolated from local settings, and a QR code is shown for phones.
- **OBS overlay:** add `&embed=1&bg=transparent`, plus optional `&scale=`, `&align=` and `&color=`.
- **Presets:** saved in `localStorage`, with JSON export and import.

## How time is kept

Timers never accumulate `setInterval` ticks. A running timer stores `{ anchor, acc }`, and elapsed time is `acc + (now - anchor)`. That keeps it accurate in throttled background tabs, after a reload, and across synced windows. Timer events (end, warnings, phase changes, exam milestones) are derived from this state in `src/lib/signals.ts` and fire once per window. Only the display window, or the dashboard when no display is open, plays sound.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest: time math, DST, meeting overlap, alarms, solar/moon, signals
npm run lint
npm run build      # → dist/ (static, base './')
```

Deploy by copying `dist/` to `web-tools/Time-Deck/`.

### Structure

```
src/
  lib/        pure logic: time, tz, solar, alarms, sequence, signals, share, sync, audio
  store/      zustand store (persist + cross-window sync), actions, defaults
  modes/      one file per mode: Display + Settings (lazy-loaded)
  components/ DeckView (display shell), ControlBar, Engine (events/alarms), UI primitives
  dashboard/  dashboard page + panels      display/  full-screen page
  i18n/       t('key', 'English') with es / fr / de dictionaries
  styles/     tokens, dashboard, deck styles, per-mode layouts
```

UI strings use `t('key', 'English fallback')`, so English needs no dictionary. Add a language by creating `src/i18n/<code>.json` and registering it in `makeT.ts` and `UI_LANGS`.

## Credits

- Land outlines: Natural Earth via [world-atlas](https://github.com/topojson/world-atlas) (public domain)
- Sun/moon times: [SunCalc](https://github.com/mourner/suncalc) (BSD-2)
- Flag glyphs on Windows: [Twemoji Country Flags](https://github.com/talkjs/country-flag-emoji-polyfill) (CC-BY 4.0, Twitter/Twemoji)
- Icons: [Lucide](https://lucide.dev) (ISC)
