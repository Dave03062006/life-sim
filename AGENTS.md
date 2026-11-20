# Guide for AI helpers

Life Sim is a browser life simulator (Vite, React 19, TypeScript, Zustand, Vitest). Read the spec and plans before changing anything:

- Design: `docs/superpowers/specs/2026-11-16-life-sim-design.md`
- Plans: `docs/superpowers/plans/` (seven plans; only Plan 1 exists so far)

## Folder map

Folders marked (later) are in the spec but do not exist yet.

```
src/
  app/        the store, which screen is showing, sound, address options
  engine/     clock, randomness, saves, settings (input and motion come later)
  life/       the rules of a life, as plain TypeScript with no React
  content/    typed data: countries/indonesia/ (diseases/ and quiz/ come later)
  minigames/  framework.ts, then one folder per type (today: timing/)
  styles/     the two skins' tokens, the art manifest, sprite helpers
  screens/    TopBar, SettingsDialog, year/ (Title, NewLife, Summary, PastLives come later)
  ui/         shared parts: bar, icon, changes list, reduced-motion hook
  dev/        (later) the life simulator used by tests, and a frame meter
tools/art/    the Python conversion scripts
scripts/      (later) browser checks: play-through, accessibility, keyboard, screenshots
public/art/   converted WebP art and its manifest
design/       source art, prompts and mockups; not part of the build
docs/         the design, build plans, (later) a code tour
```

## Commands

Node 22.12 or newer.

```bash
npm install
npm run dev       # dev server
npm run check     # type check and lint
npm test          # Vitest, one run
npm run build     # type check and production build
```

Run `npm run check`, `npm test` and `npm run build` before committing.

## Rules

- TypeScript strict, with `noUncheckedIndexedAccess`.
- `src/life/` is pure: no React, no DOM, no `Date`, no `Math.random`. All randomness comes from `src/engine/random.ts`.
- Components never hold raw colour values; colours come from the skin token files.
- Text is plain English inside the data. The game's name appears only as `GAME_NAME` (`src/app/name.ts`).
- Every unavailable activity states its reason. There are no once-a-year caps.
- Pixel art is displayed at exactly twice its logical size.
- Nothing is copied from BitLife.
- Scaled effects round half away from zero: `Math.sign(x) * Math.round(Math.abs(x))`.
- Spec numbers in use: result thresholds 0.25, 0.5, 0.85; result scales 0, 0.5, 1, 1.5; overwork +4 Stress and -2 Health per point; energy budgets 3, 5, 7, 9, 10, 12, 12, 8; minimum budget 2.
- Saves: IndexedDB database `life-sim`. Settings: localStorage `life-sim-settings`.

## How to add an activity

1. Add an entry in `src/content/countries/indonesia/activities.ts` through the `a(...)` helper. The fields are defined in `src/content/types.ts`.
2. The helper sets the icon id to `act-<id>` (for example `act-futsal`). That id needs an entry in `tools/art/names.json` and a drawn icon. For a new icon, update the source sheet and rerun `python tools/art/build.py` (see `tools/art/README.md`). The display falls back to the category icon only when art is missing at runtime; that does not make the content test pass.
3. Run `npm test`. The content test in `src/content/content.test.ts` checks the entry, including that its icon exists.

Adding events, conditions or mini-game types: those systems come in later plans.

## Tone rules for writers

Clean, funny, grounded. Everyday mischief is in (skipping class, a white lie, cheating on a test) with consequences. Crime, drugs, sex and gore are out until a dark-humour setting exists. Humour comes from recognisable life, not cruelty. No religion is assigned to the character; holidays are written neutrally.

## Anti-goals

These make the game a failure even if it works:

- Constricting: canned two-option choices; locks and once-a-year caps with no reason; one fixed school-job-retire path.
- Dice instead of play: a result that ignores what the player did.
- Silent results: a stat changing with nothing seen, heard or felt.
- A wall with no reason: anything unavailable must say why and what would open it.
- A BitLife copy: no names, text, art, sounds or layout taken from it.
- Medical advice: disease content is based on real sources, and the game says plainly it is a game and not advice.

## Long-term goals

- Every activity gets its own unique mini-game. Milestone 1 uses six reusable types as a first step.
- A broad catalogue of real conditions, each with cited sources. Milestone 1 ships about 14.

## Commits

Commits are made under Dave's account, with no AI co-author line.
