# Guide for AI helpers

Life Sim is a browser life simulator (Vite, React 19, TypeScript, Zustand, Vitest). Read the spec and plans before changing anything:

- Design: `docs/superpowers/specs/2026-11-16-life-sim-design.md`
- Plans: `docs/superpowers/plans/` (Plans 1 to 4 are done)

## Folder map

Folders marked (later) are in the spec but do not exist yet.

```
src/
  app/        the store, which screen is showing, backup.ts (export and import), sound, address options
  engine/     clock, randomness, saves, settings (input and motion come later)
  life/       the rules of a life, as plain TypeScript with no React; events.ts (drawing and resolving events),
              people.ts (family, friends, closeness), personActions.ts (Spend time, Talk, Give a gift, Ask out),
              roll.ts (the new-life roll), death.ts (the odds of dying each year), summary.ts (the life summary)
  content/    typed data: countries/indonesia/ (diseases/ and quiz/ come later)
  minigames/  framework.ts, then one folder per type (timing, tapping, memory, quiz, catch, typing)
  styles/     the two skins' tokens, the art manifest, sprite helpers
  screens/    TopBar, SettingsDialog, Title (with export and import), NewLife, ConfirmDialog, Summary, PastLives,
              year/ (EventDialog, InterestDialog, PeopleList and the rest of the year screen)
  ui/         shared parts: bar, icon, changes list, reduced-motion hook
  dev/        simulate.ts, the life simulator used by tests (a frame meter comes later)
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
3. People activities can involve real people. `with: 'mother'` (or another relation) needs one such person, or the activity says "You have no mother."; a woman is picked first, so `with: 'grandparent'` calls a grandmother before a grandfather. It nudges their closeness +4 (scaled like a benefit, -2 on a fail) and counts as time together. `together: ['mother', 'father', 'sibling']` nudges everyone of those relations +2. `makes: 'friend'` adds a new same-age friend of the player's gender, closeness 40, on a Good or Great result; use `{name}` in its Good and Great lines.
4. Run `npm test`. The content test in `src/content/content.test.ts` checks the entry, including that its icon exists.

## How to add a stage's content

Every stage needs at least two activities in each open category. Add them with the `a(...)` helper as above, and use the `wider` table in `activities.ts` to widen which stages an existing activity covers. Stage events go in `events.ts`. `npm test` plays 1,000 lives and fails on bad content, so run it after every addition.

## Balance guard

`src/dev/simulate.ts` plays whole lives. `npm test` plays 1,000 and `npm run simulate` plays 10,000. The median age at death must stay between 65 and 86 until Plan 6 adds illness; change the odds in `death.ts` only with this test in view. `death.ts` follows the spec's odds, plus a 0.6 tier from age 100 and certain death at 115, which extends the spec.

## How to add an event

Add an `EventDef` to `src/content/countries/indonesia/events.ts` (type in `src/content/types.ts`). The content test checks it.

- `id`, `kind` (`choice` or `news`), `stages`, `weight` (0 turns it off), `big` (at most one big event per age-up), `title`, `text`.
- `cast`: roles to fill, such as `{ friend: 'friend' }`. Use `{friend}` in any text. A role picks among fitting people not already cast; if one cannot be filled the event does not fire.
- `when`: conditions that must all hold. Kinds: `stat` (min/max), `memory`, `no-memory`, `money`, `age` (min/max).
- Choice events have 2-5 `actions`, each with `label`, `chance` (0-100) and outcomes `success`, `mixed`, `fail`. An outcome has text, `effects`, `money`, `closeness` (role to change), `memory` (id and text, saved with the cast's people) and `addPerson` (a new crush, skipped when the romance question is unanswered or says none).
- `open`: `{ condition, note }` shows an action only when the condition holds. The note says why, for example "Open to you: your choice at 15".
- `romance: true` on an action needs the romance question answered first. Every choice event keeps at least two actions that are not romance, so nobody is boxed in.
- `recall`: `{ memory, text }` adds a "Remembered" line when you hold that memory.
- `art`: banner key in the art manifest; defaults to the event id.
- `manners`: override the default Calmly / Bluntly / With a joke.
- Memory casting: a held memory restricts every cast role to that memory's people, so an event that references a memory should cast only that memory's relation.
- Tone: follow the tone rules below. Events are recognisable life, written plainly and with humour that is not cruel.

## How people work

`src/life/people.ts`. A `Person` has a relation (mother, father, sibling, grandparent, friend, crush, partner), age, gender and closeness from 0 to 100. Each age-up everyone ages one year and loses 3 closeness (not below 0), unless you spent time with them that year (`spentWith`, cleared at age-up). You can keep eight friends; when a ninth arrives the least close of the existing eight drifts away (never the newcomer). Spending time, talking (1 energy) and giving a gift all count as time together. You can have one partner at a time. Memories keep the ids of the people in them. `life.interest` is null until the romance question is answered, then women, men, both or none; new crushes match it, and none means no romance actions and no crushes. It can be changed in Settings.

## How to add a mini-game type

1. Add the id to `MinigameType` in `src/content/types.ts`.
2. Write the rules in `src/minigames/<type>/rules.ts` against `GameRules` in `framework.ts`, with tests beside them.
3. Write the view in `src/minigames/<type>/View.tsx`.
4. Add an entry to `GAMES` in `src/minigames/registry.ts`: rules, view, an instruction and, if the game has a play button, its verb. `rulesFor` reads from there. `src/minigames/index.test.ts` checks every type has its own entry.
5. Add any new per-activity fields to `Theme` in `src/minigames/themes.ts` (existing ones: words, verb, instruction, pads, quiz, catchItems, typingWords) and give activities their theme under their id.
6. Clickable controls inside a game must not steal focus from the game: call `preventDefault` on `pointerdown` and set `tabIndex={-1}`.
7. Typing needs a physical keyboard today; there is no on-screen keyboard.

A new type is a step toward the long-term goal below: a unique mini-game for every activity.

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

## Plan numbering

1. Foundation and the playable year. 2. More mini-games. 3. Events, memories and people. 4. A whole life (done). 5. School, work, money and family (marriage, children). 6. Health and disease. 7. Content and art. 8. Checks and publishing.
