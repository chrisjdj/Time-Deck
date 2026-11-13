# Contributing to Time-Deck

Thanks for helping out! Bug reports, ideas and pull requests are all welcome.

## Setup

```bash
npm install
npm run dev     # http://localhost:5173
```

## Before opening a pull request

```bash
npm test        # vitest
npm run lint    # eslint
npm run build   # type-check + production build
```

All three must pass. CI runs the tests and the build on every push to `main`.

## Guidelines

- Keep time logic in `src/lib/` pure and covered by tests in `tests/`. Running timers are stored as `{ anchor, acc }`; never count `setInterval` ticks.
- Everything must keep working offline and without a server. Don't add analytics, trackers or remote calls.
- UI strings go through `t('key', 'English fallback')`.

## Adding a language

1. Copy `src/i18n/es.json` to `src/i18n/<code>.json` and translate the values.
2. Register it in `src/i18n/makeT.ts` and add it to `UI_LANGS` in `src/i18n/index.ts`.

## Adding a mode

1. Create `src/modes/<mode>.tsx` exporting `Display` and `Settings` components.
2. Register it in `src/modes/index.ts` (group, icon, label, description, lazy loaders).
3. Add its settings and defaults in `src/types.ts` and `src/store/defaults.ts`, and its layout styles in `src/styles/_modes.scss`.
