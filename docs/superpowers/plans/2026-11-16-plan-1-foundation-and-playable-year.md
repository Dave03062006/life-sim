# Plan 1: Foundation and the Playable Year — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The approved year screen runs as a real app in both skins, on a tested rules engine: a late-teen life, 46 activities with energy, overwork, rest and repeats, the Timing mini-game, age up, a journal, automatic saving, and the repo's documents.

**Architecture:** A pure TypeScript rules engine (`src/life/`) turns a life plus an action into a new life. Content is typed data (`src/content/`). React screens read a Zustand store that calls the engine and saves after every action. The two skins are CSS token files over one set of components. Mini-games are pure rules advanced in fixed steps, with a separate view.

**Tech Stack:** Vite, React 19, TypeScript, Zustand, idb-keyval, Vitest with jsdom and Testing Library, Oxlint. Python 3 with Pillow and NumPy for the art tools only.

**Spec:** `docs/superpowers/specs/2026-11-16-life-sim-design.md`. Visual reference: `design/mockup-v2/year-screen-v2.html`.

## Where this plan sits

Milestone 1 is built as seven plans. Each ends in working software. Plans 2 to 7 are written when their turn comes.

1. **Foundation and the playable year** (this plan).
2. Five more mini-games: Tapping, Memory, Quiz with a starter question bank, Catch, Typing.
3. Events, memories and people.
4. A whole lifespan: eight stages, the new-life roll, school, work, money, death, the life summary, past lives, export and import.
5. Health and disease.
6. Content and art for every stage, including the staged 60 images.
7. Checks and publishing: the life simulation, browser checks, accessibility, a code tour, Vercel.

## Global Constraints

- Repo root is `C:/Users/DAVE TRISTIAN/Projects/life-sim`. All paths below are relative to it.
- Commits are made under Dave's git identity (`Dave Tristian Nurcahyo <146943532+Dave03062006@users.noreply.github.com>`). **No `Co-Authored-By` line and no AI attribution in any commit.**
- Node 22.12 or newer. TypeScript strict, with `noUncheckedIndexedAccess`.
- `src/life/` is pure: no React, no DOM, no `Date`, no `Math.random`. All randomness comes from `engine/random.ts`.
- Components never hold raw colour values; colours come from the skin token files.
- Text is plain English inside the data. The game's name appears only as `GAME_NAME`.
- Every unavailable activity states its reason. There are no once-a-year caps.
- Pixel art is displayed at exactly twice its logical size.
- Nothing is copied from BitLife.
- Rounding of scaled effects is **half away from zero**: `Math.sign(x) * Math.round(Math.abs(x))`.
- Numbers from the spec used here: result thresholds 0.25, 0.5, 0.85; result scales 0, 0.5, 1, 1.5; overwork +4 Stress and −2 Health per point; energy budgets 3, 5, 7, 9, 10, 12, 12, 8; minimum budget 2.

## Review Focus

Failure modes the spec implies that are most likely to bite a player. Each has a test in the task named.

1. **A damaged or newer save on start** must give a fresh game with the bad data kept aside, never a crash. (Task 9)
2. **Finishing an activity twice** (Space held, double click) must apply the result once. (Tasks 9 and 11)
3. **The window losing focus during a mini-game** must pause it. (Task 11)
4. **Stats at their bounds** must stay within 0 and 100, and money may go negative. (Task 3)
5. **Energy far below zero** must keep working and keep charging overwork. (Tasks 3 and 6)

---

### Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.test.json`, `.oxlintrc.json`, `vercel.json`, `.gitignore`, `.gitattributes`
- Create: `src/main.tsx`, `src/app/App.tsx`, `src/app/name.ts`, `src/test/setup.ts`
- Test: `src/app/App.test.tsx`

**Interfaces:**
- Produces: `GAME_NAME: string` from `src/app/name.ts`; `App` component from `src/app/App.tsx`; npm scripts `dev`, `build`, `preview`, `typecheck`, `lint`, `check`, `test`.

- [ ] **Step 1: Start the repository**

```bash
git -C "C:/Users/DAVE TRISTIAN/Projects/life-sim" init -b main
```

- [ ] **Step 2: Write the config files**

Copy these from `C:/Users/DAVE TRISTIAN/Projects/bible-game` unchanged: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.test.json`, `vercel.json`, `.gitattributes`.

Write the rest with these exact differences from Golden Thread's:
- `package.json`: name `life-sim`, `"type": "module"`, `"engines": { "node": ">=22.12" }`, scripts `dev: vite`, `build: tsc -b && vite build`, `preview: vite preview`, `typecheck: tsc -b`, `lint: oxlint`, `check: npm run typecheck && npm run lint`, `test: vitest run`, `test:watch: vitest`.
- `vite.config.ts`: only the `react()` plugin; the same `test` block (`environment: 'jsdom'`, `include: ['src/**/*.test.{ts,tsx}']`) plus `setupFiles: ['src/test/setup.ts']`. That file calls Testing Library's `cleanup` after each test.
- `.oxlintrc.json`: same rules; `ignorePatterns: ["dist", "shots", "design", "tools"]`.
- `index.html`: title `Life-sim`, description `A life simulator you play a year at a time.`, theme colour `#0B1E57`, no favicon line.
- `.gitignore`: `node_modules/`, `dist/`, `shots/`, `.env*`, `!.env.example`, `*.log`, `.DS_Store`, `Thumbs.db`, `.superpowers/`, `design/art-source/`, `__pycache__/`.

- [ ] **Step 3: Install**

```bash
npm install react react-dom zustand idb-keyval @fontsource-variable/plus-jakarta-sans @fontsource-variable/pixelify-sans
npm install -D vite @vitejs/plugin-react vitest jsdom typescript oxlint @testing-library/react @testing-library/dom @testing-library/user-event @types/react @types/react-dom @types/node fake-indexeddb
```

- [ ] **Step 4: Write the failing test**

```tsx
// src/app/App.test.tsx
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { App } from './App'
import { GAME_NAME } from './name'

it('shows the name of the game', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: GAME_NAME })).toBeTruthy()
})
```

- [ ] **Step 5: Run it and see it fail**

Run: `npm test`
Expected: FAIL, cannot find `./App`.

- [ ] **Step 6: Implement**

`src/app/name.ts` exports `GAME_NAME = 'Life-sim'`. `src/app/App.tsx` exports `App`, which for now renders an `<h1>` with `GAME_NAME`. `src/main.tsx` imports both font packages and renders `<App />` in `StrictMode` into `#root`.

- [ ] **Step 7: Verify**

Run: `npm test` then `npm run check` then `npm run build`
Expected: 1 test passes; no type or lint errors; `dist/` is written.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "Set up the project with Vite, React and TypeScript"
```

The commit includes `docs/` and `design/mockup-v2/`. `design/art-source/` stays out of git.

---

### Task 2: Engine pieces from Golden Thread

**Files:**
- Create by copying from `C:/Users/DAVE TRISTIAN/Projects/bible-game/src`: `src/engine/random.ts`, `src/engine/random.test.ts`, `src/engine/clock.ts`, `src/engine/clock.test.ts`, `src/engine/save/storage.ts`, `src/engine/save/checksum.ts`
- Modify: `src/engine/random.ts` (add `state`)

**Interfaces:**
- Produces: `createRng(seed: number): Rng`, `randomSeed(): number`; `Rng` gains `readonly state: number`; `gameClock: Clock`, `createClock(deps)`; `KeyValueStore`, `memoryStore()`, `indexedDbStore(databaseName, storeName)`; `checksumOf(value: unknown): string`.

- [ ] **Step 1: Copy the six files unchanged**

- [ ] **Step 2: Add the failing test** to `src/engine/random.test.ts`

```ts
it('continues from a stored state', () => {
  const a = createRng(42)
  a.next()
  a.next()
  const b = createRng(a.state)
  expect(b.next()).toBe(a.next())
})
```

- [ ] **Step 3: Run it and see it fail**

Run: `npx vitest run src/engine/random.test.ts`
Expected: FAIL, `state` is undefined.

- [ ] **Step 4: Add `readonly state: number` to `Rng`**

Document it as "The generator's position. `createRng(state)` continues from exactly here." Implement it as a getter on the returned object that reads the closure's `state`.

- [ ] **Step 5: Verify**

Run: `npm test && npm run check`
Expected: all copied tests and the new one pass.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Bring over the seeded generator, clock and storage from Golden Thread"
```

---

### Task 3: Life, stages, stats and energy

**Files:**
- Create: `src/life/types.ts`, `src/life/stages.ts`, `src/life/stats.ts`, `src/life/energy.ts`, `src/life/format.ts`, `src/life/testLife.ts`
- Test: `src/life/stages.test.ts`, `src/life/stats.test.ts`, `src/life/energy.test.ts`, `src/life/format.test.ts`

**Interfaces:**
- Produces, from `types.ts`:

```ts
export type StatKey = 'health' | 'happiness' | 'smarts' | 'looks' | 'stress' | 'reputation'
export type Stats = Record<StatKey, number>
export type StageId = 'baby' | 'small-child' | 'child' | 'early-teen' | 'late-teen' | 'young-adult' | 'adult' | 'senior'
export type CategoryId = 'school' | 'mind' | 'body' | 'health' | 'people' | 'money' | 'fun' | 'rest'
export type Gender = 'female' | 'male'
export interface Change { key: StatKey | 'money' | 'energy'; delta: number }
export interface JournalEntry { age: number; kind: 'milestone' | 'activity'; text: string; changes: Change[] }
export interface Life {
  version: 1
  id: string
  rng: number               // the seeded generator's position
  country: 'indonesia'
  name: string
  gender: Gender
  city: string
  age: number
  stats: Stats
  money: number             // whole Rupiah; may be negative
  energySpent: number       // this year; may exceed the budget (overwork)
  restsThisYear: number
  doneThisYear: Record<string, number>
  journal: JournalEntry[]
}
```

- `stages.ts`: `interface StageDef { id: StageId; from: number; to: number; energy: number; categories: CategoryId[] }`, `STAGES: readonly StageDef[]`, `stageOf(age: number): StageDef`.
- `stats.ts`: `STAT_KEYS`, `STAT_LABEL: Record<StatKey, string>`, `isBenefit(key: Change['key'], delta: number): boolean`, `roundAway(x: number): number`, `applyChanges(life: Life, changes: readonly Change[]): Life`.
- `energy.ts`: `OVERWORK_STRESS = 4`, `OVERWORK_HEALTH = -2`, `MIN_BUDGET = 2`, `energyBudget(life): number`, `energyLeft(life): number`, `overworkPoints(life, cost: number): number`, `restGain(life, base: number): number`, `repeatScale(timesDone: number): number`.
- `format.ts`: `formatRupiah(amount: number): string`.
- `testLife.ts`: `testLife(overrides?: Partial<Life>): Life`, the life from the mockup: age 16, health 58, happiness 71, smarts 64, looks 49, stress 35, reputation 62, money 215000, nothing spent, empty journal, name `Raka Pratama`, male, Surabaya.

- [ ] **Step 1: Write the failing tests**

```ts
// src/life/stages.test.ts
it('gives each age its stage and energy', () => {
  expect([0, 2, 3, 5, 6, 11, 12, 14, 15, 17, 18, 34, 35, 59, 60, 95].map((a) => stageOf(a).id)).toEqual([
    'baby', 'baby', 'small-child', 'small-child', 'child', 'child', 'early-teen', 'early-teen',
    'late-teen', 'late-teen', 'young-adult', 'young-adult', 'adult', 'adult', 'senior', 'senior',
  ])
  expect(STAGES.map((s) => s.energy)).toEqual([3, 5, 7, 9, 10, 12, 12, 8])
  expect(stageOf(1).categories).toEqual(['people', 'fun', 'health', 'rest'])
  expect(stageOf(4).categories).toEqual(['mind', 'people', 'fun', 'health', 'rest'])
  expect(stageOf(16).categories).toEqual(['school', 'mind', 'body', 'health', 'people', 'money', 'fun', 'rest'])
})
```

```ts
// src/life/stats.test.ts
it('keeps stats within 0 and 100 and lets money go negative', () => {
  const life = applyChanges(testLife({ stats: { ...testLife().stats, health: 98, stress: 2 } }), [
    { key: 'health', delta: 5 }, { key: 'stress', delta: -5 }, { key: 'money', delta: -300000 },
  ])
  expect(life.stats.health).toBe(100)
  expect(life.stats.stress).toBe(0)
  expect(life.money).toBe(-85000)
})
it('treats falling stress as a benefit', () => {
  expect(isBenefit('stress', -3)).toBe(true)
  expect(isBenefit('stress', 3)).toBe(false)
  expect(isBenefit('health', 3)).toBe(true)
  expect(isBenefit('money', -1)).toBe(false)
})
it('rounds half away from zero', () => {
  expect([1.5, -1.5, 4.5, 2.4, -2.4].map(roundAway)).toEqual([2, -2, 5, 2, -2])
})
```

```ts
// src/life/energy.test.ts
const withStats = (s: Partial<Stats>, more: Partial<Life> = {}) => testLife({ stats: { ...testLife().stats, ...s }, ...more })
it('sets the budget from the stage, health and stress', () => {
  expect(energyBudget(testLife())).toBe(10)
  expect(energyBudget(withStats({ health: 29 }))).toBe(8)
  expect(energyBudget(withStats({ stress: 70 }))).toBe(8)
  expect(energyBudget(withStats({ health: 29, stress: 70 }))).toBe(6)
  expect(energyBudget(withStats({ health: 20, stress: 80 }, { age: 1 }))).toBe(2)
})
it('lets energy go far below zero', () => {
  expect(energyLeft(testLife({ energySpent: 30 }))).toBe(-20)
  expect(overworkPoints(testLife({ energySpent: 30 }), 2)).toBe(2)
})
it('counts only the points that fall below zero as overwork', () => {
  expect(overworkPoints(testLife({ energySpent: 9 }), 2)).toBe(1)
  expect(overworkPoints(testLife({ energySpent: 5 }), 2)).toBe(0)
})
it('gives less from each rest and never more than was spent', () => {
  expect(restGain(testLife({ energySpent: 5 }), 3)).toBe(3)
  expect(restGain(testLife({ energySpent: 5, restsThisYear: 1 }), 3)).toBe(2)
  expect(restGain(testLife({ energySpent: 5, restsThisYear: 3 }), 3)).toBe(0)
  expect(restGain(testLife({ energySpent: 1 }), 3)).toBe(1)
  expect(restGain(testLife(), 3)).toBe(0)
})
it('shrinks repeats', () => {
  expect([0, 1, 3].map(repeatScale)).toEqual([1, 0.5, 0.25])
})
```

```ts
// src/life/format.test.ts
it('writes Rupiah with dots', () => {
  expect(formatRupiah(215000)).toBe('Rp 215.000')
  expect(formatRupiah(4500000)).toBe('Rp 4.500.000')
  expect(formatRupiah(-85000)).toBe('−Rp 85.000')
  expect(formatRupiah(0)).toBe('Rp 0')
})
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/life`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement the six files**

`STAGES` uses the ages and budgets in spec 5.1. `energyBudget` takes 2 off for Health below 30 and 2 off for Stress of 70 or more, never below `MIN_BUDGET`. `energyLeft` is budget minus `energySpent`. `formatRupiah` groups digits by hand with a regular expression (no `Intl`), and uses the minus sign `−`. `applyChanges` ignores `energy` changes.

- [ ] **Step 4: Verify**

Run: `npm test && npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add the life record, stages, stats and energy rules"
```

---

### Task 4: Art tools, converted art and the manifest

**Files:**
- Move: `design/art-tools/artlib.py` to `tools/art/artlib.py`; `design/art-tools/build.py` to `tools/art/build.py` (rewritten)
- Create: `tools/art/names.json`, `tools/art/README.md`, `public/art/*.webp`, `src/styles/art-manifest.json`, `src/styles/art.ts`
- Test: `src/styles/art.test.ts`

**Interfaces:**
- Consumes: `StageId`, `Gender`, `CategoryId` from Task 3.
- Produces, from `src/styles/art.ts`:

```ts
export type Skin = 'flat' | 'pixel'
export const ICON_COLUMNS = 8
export function hasIcon(id: string): boolean
export function iconIndex(id: string, fallback: string): number
export function iconSheet(skin: Skin): string
export function scenePath(stage: StageId, gender: Gender, skin: Skin): string
export function ambientPath(stage: StageId, gender: Gender, skin: Skin): string
export function gameScenePath(category: CategoryId, skin: Skin): string | null
```

- Manifest shape: `{ icons: { sheet: Record<Skin, string>, index: Record<string, number> }, scenes: Record<string, Record<Skin, string>>, ambient: Record<string, Record<Skin, string>>, games: Record<string, Record<Skin, string>>, events: Record<string, Record<Skin, string>> }`. Scene keys are `<stage>-<gender>`. Game keys are category ids.

- [ ] **Step 1: Rename the source images** in `design/art-source/` (this folder is not in git)

`hero-<skin>.png` becomes `scene-late-teen-male-<skin>.png`; `icons1` to `icons4` become `icons-01` to `icons-04`; `futsal-<skin>.png` becomes `game-body-<skin>.png`; `event-<skin>.png` becomes `event-class-trip-<skin>.png`.

- [ ] **Step 2: Write `tools/art/names.json`**

Sixteen icon ids per sheet, in reading order:
- `icons-01`: `cat-school`, `cat-mind`, `cat-body`, `cat-health`, `cat-people`, `cat-money`, `cat-fun`, `cat-rest`, `mg-timing`, `mg-tapping`, `mg-memory`, `mg-quiz`, `mg-catch`, `mg-typing`, `ui-energy`, `ui-time`
- `icons-02`: `act-study-exam`, `act-homework`, `act-osis`, `act-group-project`, `act-bimbel`, `act-skip-class`, `act-library`, `act-english`, `act-code`, `act-chess`, `act-diary`, `act-puzzle-cube`, `act-futsal`, `act-jog`, `act-gym`, `act-badminton`
- `icons-03`: `act-swim`, `act-silat`, `act-doctor`, `act-medicine`, `act-checkup`, `act-dentist`, `act-eat-better`, `act-counsellor`, `act-hang-out`, `act-cook`, `act-family-dinner`, `act-call-nenek`, `act-new-friend`, `act-crush`, `act-warung-shift`, `act-sell-snacks`
- `icons-04`: `act-tutor`, `act-save-bank`, `act-clothes`, `act-motorbike`, `act-band`, `act-warnet`, `act-film`, `act-karaoke`, `act-ride-town`, `act-comics`, `act-sleep-in`, `act-nap`, `act-meditate`, `act-pijat`, `act-holiday`, `act-do-nothing`

- [ ] **Step 3: Write the failing test**

```ts
// src/styles/art.test.ts
import { existsSync } from 'node:fs'
import manifest from './art-manifest.json'

it('finds an icon, then its fallback, then the first icon', () => {
  expect(iconIndex('act-futsal', 'cat-body')).toBe(28)
  expect(iconIndex('not-drawn-yet', 'cat-body')).toBe(2)
  expect(iconIndex('not-drawn-yet', 'nor-this')).toBe(0)
  expect([hasIcon('act-futsal'), hasIcon('not-drawn-yet')]).toEqual([true, false])
})
it('falls back to the nearest stage, then the other gender', () => {
  expect(scenePath('late-teen', 'male', 'flat')).toBe('/art/scene-late-teen-male-flat.webp')
  expect(scenePath('adult', 'female', 'pixel')).toBe('/art/scene-late-teen-male-pixel.webp')
})
it('has a mini-game scene for Body and a plain panel elsewhere', () => {
  expect(gameScenePath('body', 'flat')).toBe('/art/game-body-flat.webp')
  expect(gameScenePath('mind', 'flat')).toBeNull()
})
it('names only files that exist', () => {
  const paths = JSON.stringify(manifest).match(/\/art\/[^"]+/g) ?? []
  expect(paths.length).toBeGreaterThan(8)
  for (const p of paths) expect(existsSync(`public${p}`), p).toBe(true)
})
```

- [ ] **Step 4: Run it and see it fail**

Run: `npx vitest run src/styles/art.test.ts`
Expected: FAIL, no manifest.

- [ ] **Step 5: Rewrite `tools/art/build.py`**

Run from the repo root as `python tools/art/build.py`. It reads `design/art-source/` and `tools/art/names.json`, and writes `public/art/` and `src/styles/art-manifest.json`. It keeps the conversions already proven in `design/art-tools/build.py`: Flat scenes resized to 720×720 and wide scenes to 1440×960; Pixel character scenes snapped to 160×160, wide game scenes to 360×240 and event banners to 384×256, each saved at four times that size, lossless; icon sheets cut into uniform 128-pixel tiles and packed eight to a row; one blurred 48×48 ambient image per character scene for Flat and one 24×24 mosaic for Pixel. Output names follow the source names: `scene-…`, `ambient-…`, `game-…`, `event-…`, `icons-<skin>.webp`.

`tools/art/README.md` says: needs Python 3 with Pillow and NumPy; the command; that sources are not in git and live in the Figma file "Life-sim art".

- [ ] **Step 6: Build the art, then implement `src/styles/art.ts`**

Run: `python tools/art/build.py`
Expected: twelve or more `.webp` files in `public/art/` and a manifest.

For `scenePath`, try the same gender at the same stage, then stages by increasing distance in `STAGES` order, then repeat for the other gender.

- [ ] **Step 7: Verify**

Run: `npm test && npm run check`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "Add the art tools, the converted art and its manifest"
```

---

### Task 5: Content types and the late-teen activities

**Files:**
- Create: `src/content/types.ts`, `src/content/index.ts`, `src/content/countries/indonesia/index.ts`, `src/content/countries/indonesia/activities.ts`, `src/content/countries/indonesia/milestones.ts`
- Test: `src/content/content.test.ts`

**Interfaces:**
- Consumes: Task 3 types; `hasIcon` from Task 4.
- Produces, from `src/content/types.ts`:

```ts
export type MinigameType = 'timing' | 'tapping' | 'memory' | 'quiz' | 'catch' | 'typing'
export type ResultTier = 'fail' | 'weak' | 'good' | 'great'
export type Requirement =
  | { kind: 'min-age'; age: number; reason: string }
  | { kind: 'stat'; key: StatKey; min: number; reason: string; openNote: string }
export interface ActivityDef {
  id: string
  category: CategoryId
  title: string
  description: string
  icon: string                                        // an art id such as 'act-futsal'
  stages: StageId[]
  minigame?: { type: MinigameType; theme: string }    // absent: the activity finishes at once as a Good result
  energy: number                                      // cost; 0 for rest
  energyBack?: number                                 // energy returned by a non-rest activity
  rest?: number                                       // base energy restored by a rest activity
  money?: number                                      // negative is a price, positive is earnings
  effects: Partial<Record<StatKey, number>>           // benefits scale with the result; costs do not
  failPenalty?: Partial<Record<StatKey, number>>
  requires?: Requirement[]
  lines: string | Record<ResultTier, string>          // journal text
}
export interface ContentPack { id: 'indonesia'; activities: ActivityDef[]; milestones: Record<number, string> }
```

- `src/content/index.ts`: `packFor(country: Life['country']): ContentPack`.

- [ ] **Step 1: Write the failing test**

```ts
// src/content/content.test.ts
const pack = packFor('indonesia')
const lateTeen = pack.activities.filter((a) => a.stages.includes('late-teen'))

it('offers 46 late-teen activities, at least four in every category', () => {
  expect(lateTeen).toHaveLength(46)
  for (const c of stageOf(16).categories) expect(lateTeen.filter((a) => a.category === c).length, c).toBeGreaterThanOrEqual(4)
})
it('gives every activity what the screen and the rules need', () => {
  expect(new Set(pack.activities.map((a) => a.id)).size).toBe(pack.activities.length)
  for (const a of pack.activities) {
    expect(a.title.length, a.id).toBeGreaterThan(2)
    expect(a.description.length, a.id).toBeGreaterThan(9)
    expect(hasIcon(a.icon), a.id).toBe(true)
    expect(typeof a.lines === 'string' ? a.lines.length : Object.keys(a.lines).length, a.id).toBeGreaterThan(3)
    for (const r of a.requires ?? []) expect(r.reason.length, a.id).toBeGreaterThan(9)
    if (a.rest) expect(a.energy, a.id).toBe(0)
    if (a.minigame) expect(Object.keys(a.failPenalty ?? {}).length, a.id).toBeGreaterThan(0)
  }
})
it('marks the milestone at 17', () => {
  expect(pack.milestones[17]).toContain('KTP')
})
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run src/content`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write the content**

Port every entry of the `ACTS` array in `design/mockup-v2/year-screen-v2.html` except `See a doctor` and `Buy medicine` (they arrive with illness in Plan 5). Ids, in order: `study-exam`, `homework`, `osis`, `group-project`, `bimbel`, `skip-class`, `library`, `english`, `code`, `chess`, `diary`, `puzzle-cube`, `futsal`, `jog`, `gym`, `badminton`, `swim`, `silat`, `checkup`, `dentist`, `eat-better`, `counsellor`, `hang-out`, `cook`, `family-dinner`, `call-nenek`, `new-friend`, `crush`, `warung-shift`, `sell-snacks`, `tutor`, `save-bank`, `clothes`, `motorbike`, `band`, `warnet`, `film`, `karaoke`, `ride-town`, `comics`, `sleep-in`, `nap`, `meditate`, `pijat`, `holiday`, `do-nothing`.

Mapping from the mockup's fields: the icon is `act-` plus the id; `g` becomes `minigame.type` in lower case with `theme` set to the id; `e` of −1 becomes `energyBack: 1` with `energy: 0`; `m` becomes `money`; `fx` becomes `effects` with `happy` renamed `happiness` and `rep` renamed `reputation`; `j` becomes `lines`; `req` becomes a `stat` requirement with min 60, `reason` `Needs Reputation 60 or more.` or `Needs Smarts 60 or more.`, and `openNote` `Open to you: Reputation 60+` or `Open to you: Smarts 60+`; the motorbike's lock becomes `{ kind: 'min-age', age: 17, reason: 'From age 17, with a SIM C licence' }`; `stages` is `['late-teen']`.

Every activity with a mini-game gets a `failPenalty`: Body `{ health: -3 }`; School and Mind `{ happiness: -2, stress: 2 }`; People `{ happiness: -3 }`; Money `{ reputation: -2 }`; Fun `{ happiness: -2 }`; `meditate` `{ stress: 2 }`; `eat-better` `{ happiness: -2 }`. `futsal` keeps the mockup's `{ health: -3, happiness: -2 }` and its four result lines.

`milestones.ts`: `{ 17: 'You turned 17. Your student card became a KTP, and you can now apply for a SIM C licence.' }`.

- [ ] **Step 4: Verify**

Run: `npm test && npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add the content model and the late-teen activities"
```

---

### Task 6: Doing an activity

**Files:**
- Create: `src/life/activities.ts`
- Test: `src/life/activities.test.ts`

**Interfaces:**
- Consumes: Tasks 3 and 5.
- Produces:

```ts
export const GOOD_SCORE = 0.6     // an activity with no mini-game
export const SKIP_SCORE = 0.3     // a skipped mini-game: a Weak result
export const TIER_SCALE: Record<ResultTier, number>   // { fail: 0, weak: 0.5, good: 1, great: 1.5 }
export function tierOf(score: number): ResultTier
export interface ActivityOffer {
  def: ActivityDef
  timesDone: number
  blocked: string | null     // the reason shown to the player
  openNote: string | null    // shown when a stat requirement is met
  energyGain: number         // what a rest or energyBack would restore right now
  overwork: boolean          // doing it would spend below zero
}
export function offersFor(life: Life, category: CategoryId, pack: ContentPack): ActivityOffer[]
export interface ActivityOutcome { life: Life; tier: ResultTier; entry: JournalEntry }
export function finishActivity(life: Life, def: ActivityDef, score: number): ActivityOutcome   // throws if the activity is blocked
```

- [ ] **Step 1: Write the failing tests**

```ts
// src/life/activities.test.ts
const pack = packFor('indonesia')
const act = (id: string) => pack.activities.find((a) => a.id === id)!
const offer = (life: Life, id: string) => offersFor(life, act(id).category, pack).find((o) => o.def.id === id)!

it('turns a score into a result', () => {
  expect([0, 0.24, 0.25, 0.49, 0.5, 0.84, 0.85, 1].map(tierOf)).toEqual(['fail', 'fail', 'weak', 'weak', 'good', 'good', 'great', 'great'])
})
it('scales benefits by the result and leaves costs alone', () => {
  const stats = (score: number) => finishActivity(testLife(), act('jog'), score).life.stats   // jog: health +3, stress −2
  expect([stats(0.9).health, stats(0.9).stress]).toEqual([63, 32])
  expect([stats(0.6).health, stats(0.6).stress]).toEqual([61, 33])
  expect([stats(0.3).health, stats(0.3).stress]).toEqual([60, 34])
  const studied = finishActivity(testLife(), act('study-exam'), 0.3).life.stats             // smarts +5, stress +3
  expect([studied.smarts, studied.stress]).toEqual([67, 38])
})
it('applies the penalty and no benefit on a fail', () => {
  const { life, tier, entry } = finishActivity(testLife(), act('futsal'), 0.1)
  expect(tier).toBe('fail')
  expect([life.stats.health, life.stats.happiness, life.stats.looks, life.stats.stress]).toEqual([55, 69, 49, 35])
  expect(entry.text).toContain('pulled a muscle')
})
it('shrinks a repeat', () => {
  const once = testLife({ doneThisYear: { jog: 1 } })
  const s = finishActivity(once, act('jog'), 0.6).life
  expect([s.stats.health, s.stats.stress, s.doneThisYear.jog]).toEqual([60, 34, 2])
})
it('charges overwork for points below zero, however far below', () => {
  const tired = finishActivity(testLife({ energySpent: 9 }), act('gym'), 0.6)   // gym: 2 energy, health +4, looks +3, Rp 30.000
  expect([tired.life.stats.health, tired.life.stats.looks, tired.life.stats.stress, tired.life.money, tired.life.energySpent]).toEqual([60, 52, 39, 185000, 11])
  expect(tired.entry.text).toMatch(/already worn out\.$/)
  const spent = finishActivity(testLife({ energySpent: 30 }), act('jog'), 0.6).life
  expect([spent.stats.stress, spent.energySpent]).toEqual([35 - 2 + 4, 31])
})
it('restores less with each rest', () => {
  const first = finishActivity(testLife({ energySpent: 5 }), act('sleep-in'), GOOD_SCORE)   // rest 3, stress −3
  expect([first.life.energySpent, first.life.restsThisYear, first.life.stats.stress]).toEqual([2, 1, 32])
  expect(first.entry.changes).toContainEqual({ key: 'energy', delta: 3 })
  const second = finishActivity(first.life, act('sleep-in'), GOOD_SCORE)
  expect([second.life.energySpent, second.life.stats.stress]).toEqual([0, 30])
  expect(finishActivity(testLife(), act('sleep-in'), GOOD_SCORE).entry.text).toMatch(/already rested\.$/)
})
it('scales earnings and keeps prices fixed', () => {
  const pay = (score: number) => finishActivity(testLife(), act('warung-shift'), score).life.money - 215000
  expect([pay(0.9), pay(0.6), pay(0.3), pay(0.1)]).toEqual([90000, 60000, 30000, 0])
})
it('says why an activity is closed, and why one is open', () => {
  expect(offer(testLife(), 'bimbel').blocked).toBe('You need Rp 250.000. You have Rp 215.000.')
  expect(offer(testLife(), 'motorbike').blocked).toBe('From age 17, with a SIM C licence')
  expect(offer(testLife({ age: 17 }), 'motorbike').blocked).toBe('You need Rp 4.500.000. You have Rp 215.000.')
  expect(offer(testLife(), 'osis')).toMatchObject({ blocked: null, openNote: 'Open to you: Reputation 60+' })
  expect(offer(testLife({ stats: { ...testLife().stats, reputation: 40 } }), 'osis').blocked).toContain('Reputation 60')
  expect(offer(testLife({ energySpent: 9 }), 'gym').overwork).toBe(true)
  expect(offer(testLife({ energySpent: 5, restsThisYear: 1 }), 'sleep-in').energyGain).toBe(2)
  expect(() => finishActivity(testLife(), act('bimbel'), 0.9)).toThrow()
})
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/life/activities.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/life/activities.ts`**

Order inside `finishActivity`: find the result; settle energy (rest, `energyBack`, or cost with overwork); scale each effect that `isBenefit` by the result and by `repeatScale`, rounding half away from zero and never rounding a real benefit down to nothing unless the result is a fail; add the fail penalty; scale earnings the same way to the nearest Rp 1.000; merge changes for the same stat; apply them; write the journal entry; count the activity as done. Requirements are checked in this order: minimum age, stat, money. A rest that restores nothing ends its line with ` You were already rested.` when no energy was spent, or ` Rest is not helping any more this year.` otherwise.

- [ ] **Step 4: Verify**

Run: `npm test && npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add the rules for doing an activity"
```

---

### Task 7: Starting a life and ageing up

**Files:**
- Create: `src/life/year.ts`
- Test: `src/life/year.test.ts`

**Interfaces:**
- Consumes: Tasks 2, 3 and 5.
- Produces:

```ts
export interface NewLifeOptions { seed: number; startAge?: number; name?: string; gender?: Gender; city?: string }
export function newLife(options: NewLifeOptions): Life
export function ageUp(life: Life, pack: ContentPack): Life
```

- [ ] **Step 1: Write the failing tests**

```ts
// src/life/year.test.ts
it('rolls the same life from the same seed, inside the starting ranges', () => {
  expect(newLife({ seed: 7 })).toEqual(newLife({ seed: 7 }))
  for (let seed = 1; seed <= 200; seed++) {
    const s = newLife({ seed }).stats
    expect(s.health >= 60 && s.health <= 100 && s.happiness >= 50 && s.happiness <= 90).toBe(true)
    expect(s.smarts >= 20 && s.smarts <= 90 && s.looks >= 20 && s.looks <= 90 && s.stress >= 0 && s.stress <= 20).toBe(true)
    expect(s.reputation).toBe(50)
  }
  expect(newLife({ seed: 7, startAge: 15 }).age).toBe(15)
  expect(newLife({ seed: 7 }).age).toBe(0)
})
it('ages up with the yearly changes and a clean year', () => {
  const pack = packFor('indonesia')
  const next = ageUp(testLife({ energySpent: 7, restsThisYear: 2, doneThisYear: { jog: 1 } }), pack)
  expect([next.age, next.stats.stress, next.stats.happiness, next.stats.reputation]).toEqual([17, 25, 69, 61])
  expect([next.energySpent, next.restsThisYear, next.doneThisYear]).toEqual([0, 0, {}])
  expect(next.journal.at(-1)).toMatchObject({ age: 17, kind: 'milestone' })
  expect(next.journal.at(-1)!.text).toContain('KTP')
})
it('wears the body down with age', () => {
  const pack = packFor('indonesia')
  const base = testLife().stats
  expect(ageUp(testLife({ age: 44 }), pack).stats.health).toBe(base.health - 1)
  expect(ageUp(testLife({ age: 64 }), pack).stats.health).toBe(base.health - 2)
  expect(ageUp(testLife({ age: 39 }), pack).stats.looks).toBe(base.looks - 1)
  expect(ageUp(testLife({ age: 20 }), pack).stats.looks).toBe(base.looks)
})
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/life/year.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/life/year.ts`**

`newLife` rolls with `createRng(seed)` and stores `rng.state`. Defaults: age 0, `Raka Pratama`, male, Surabaya, money 200000 (family wealth arrives in Plan 4). The id is `life-` plus the seed. `ageUp` applies spec 5.4 in this order: age plus one; Stress down 10; Happiness and Reputation move 10% of the way to 50, rounded half away from zero; Health down 1 from 45 and down 2 from 65; Looks down 1 from 40; counters cleared; the pack's milestone for the new age, if any, is added to the journal.

- [ ] **Step 4: Verify**

Run: `npm test && npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add starting a life and ageing up"
```

---

### Task 8: The mini-game contract, Timing, and how your state changes play

**Files:**
- Create: `src/minigames/framework.ts`, `src/minigames/timing/rules.ts`, `src/minigames/index.ts`, `src/life/modifiers.ts`
- Test: `src/minigames/timing/rules.test.ts`, `src/minigames/index.test.ts`, `src/life/modifiers.test.ts`

**Interfaces:**
- Consumes: `MinigameType`, `ActivityDef` (Task 5); `Life`, `energyLeft`, `stageOf` (Task 3).
- Produces:

```ts
// src/minigames/framework.ts
export const STEP = 1 / 120
export type GameKey = 'left' | 'right' | 'up' | 'down' | 'primary'
export type GameInput =
  | { kind: 'key'; key: GameKey; down: boolean }
  | { kind: 'pointer'; phase: 'down' | 'move' | 'up'; x: number; y: number }
export interface Modifiers { wobble: number; speed: number; window: number; time: number }
export const NO_MODIFIERS: Modifiers   // { wobble: 0, speed: 1, window: 1, time: 1 }
export interface GameRules<State, View> {
  type: MinigameType
  start(mods: Modifiers, seed: number): State
  step(state: State, inputs: readonly GameInput[]): State   // inputs apply first, then time advances by STEP
  view(state: State): View
  done(state: State): boolean
  score(state: State): number                               // 0 to 1, once done
}

// src/minigames/timing/rules.ts
export interface TimingView { marker: number; zone: [number, number]; core: [number, number]; stopped: boolean }
export const timing: GameRules<TimingState, TimingView>

// src/minigames/index.ts
export function rulesFor(type: MinigameType): GameRules<any, any>   // a type not built yet plays as Timing

// src/life/modifiers.ts
export function modifiersFor(life: Life, def: ActivityDef, relaxed: boolean): Modifiers
```

- [ ] **Step 1: Write the failing tests**

```ts
// src/minigames/timing/rules.test.ts
const stopAfter = (steps: number, mods = NO_MODIFIERS) => {
  let s = timing.start(mods, 1)
  for (let i = 0; i < steps; i++) s = timing.step(s, [])
  return timing.step(s, [{ kind: 'key', key: 'primary', down: true }])
}
it('scores by where the marker stops', () => {
  expect(timing.score(stopAfter(19))).toBe(1)     // 0.677, the gold centre
  expect(timing.score(stopAfter(13))).toBe(0.7)   // 0.623, the green
  expect(timing.score(stopAfter(6))).toBe(0.4)    // 0.557, a near miss
  expect(timing.score(stopAfter(60))).toBe(0)     // 0.937, wide
  expect(timing.done(stopAfter(19))).toBe(true)
  expect(timing.done(timing.start(NO_MODIFIERS, 1))).toBe(false)
})
it('narrows the zone when the window shrinks', () => {
  expect(timing.score(stopAfter(9))).toBe(0.7)                                   // 0.586 is inside 0.58–0.78
  expect(timing.score(stopAfter(9, { ...NO_MODIFIERS, window: 0.9 }))).toBe(0.4)  // but outside 0.59–0.77
})
it('wobbles, and a pointer press also stops it', () => {
  const steady = timing.view(stopAfter(19)).marker
  expect(timing.view(stopAfter(19, { ...NO_MODIFIERS, wobble: 1 })).marker).not.toBe(steady)
  const s = timing.step(timing.start(NO_MODIFIERS, 1), [{ kind: 'pointer', phase: 'down', x: 0.5, y: 0.5 }])
  expect(timing.done(s)).toBe(true)
})
it('ends by itself after twelve seconds', () => {
  let s = timing.start(NO_MODIFIERS, 1)
  for (let i = 0; i < 12 * 120 + 1; i++) s = timing.step(s, [])
  expect(timing.done(s)).toBe(true)
})
```

```ts
// src/minigames/index.test.ts
it('plays a type that is not built yet as Timing', () => {
  expect(rulesFor('timing')).toBe(timing)
  expect(rulesFor('quiz')).toBe(timing)   // changes in Plan 2
})
```

```ts
// src/life/modifiers.test.ts
const pack = packFor('indonesia')
const gym = pack.activities.find((a) => a.id === 'gym')!
it('leaves a calm, rested teenager alone', () => {
  expect(modifiersFor(testLife(), gym, false)).toEqual(NO_MODIFIERS)
})
it('shakes and hurries the stressed, narrows targets for the worn out, and eases relaxed play', () => {
  const stressed = modifiersFor(testLife({ stats: { ...testLife().stats, stress: 60 } }), gym, false)
  expect(stressed.wobble).toBe(1)
  expect(stressed.time).toBeCloseTo(0.85)
  expect(modifiersFor(testLife({ energySpent: 9 }), gym, false).window).toBeCloseTo(0.9)
  expect(modifiersFor(testLife({ age: 8 }), gym, false).window).toBeCloseTo(1.25)
  expect(modifiersFor(testLife({ age: 70 }), gym, false).speed).toBeCloseTo(0.85)
  const relaxed = modifiersFor(testLife(), gym, true)
  expect([relaxed.window, relaxed.speed, relaxed.time].map((n) => +n.toFixed(2))).toEqual([1.3, 0.8, 1.3])
})
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/minigames src/life/modifiers.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

Timing: the marker is at `0.5 + 0.46 * sin(2.5 * speed * t) + wobble * (0.034 * sin(19 * t) + 0.016 * sin(31 * t))`, kept within 0.01 and 0.99. The zone is centred on 0.68 with half-width `0.10 * window`; the gold core has half-width `0.02 * window`; a near miss is within 0.08 outside the zone. A primary key press or a pointer press stops the marker. With no press it stops by itself at `12 * time` seconds. Scores are 1, 0.7, 0.4 and 0.

`modifiersFor`: Stress of 60 or more sets `wobble` to 1 and multiplies `time` by 0.85. Less energy left than the activity costs multiplies `window` by 0.9. Small children and children multiply `window` by 1.25. Seniors multiply `speed` by 0.85. Relaxed multiplies `window` by 1.3, `speed` by 0.8 and `time` by 1.3.

- [ ] **Step 4: Verify**

Run: `npm test && npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add the mini-game contract, the Timing game and play modifiers"
```

---

### Task 9: Settings, saves and the app's state

**Files:**
- Create: `src/engine/settings.ts`, `src/ui/useReducedMotion.ts` (copied from Golden Thread), `src/engine/save/saves.ts`, `src/app/store.ts`
- Test: `src/engine/save/saves.test.ts`, `src/app/store.test.ts`

**Interfaces:**
- Consumes: Tasks 2 to 8.
- Produces:

```ts
// src/engine/settings.ts
export interface DeviceSettings { style: Skin; sound: boolean; reducedMotion: 'system' | 'on' | 'off'; relaxed: boolean }
export const DEFAULT_SETTINGS: DeviceSettings   // { style: 'flat', sound: true, reducedMotion: 'system', relaxed: false }
export const useSettings                        // Zustand, kept in localStorage as 'life-sim-settings', with update(changes) and reset()
export function prefersReducedMotion(setting: DeviceSettings['reducedMotion'], deviceWantsLess: boolean): boolean

// src/engine/save/saves.ts
export const SAVE_VERSION = 1
export interface SaveFile { version: 1; active: Life | null; past: Life[] }
export const EMPTY_SAVE: SaveFile
export interface Saves { load(): Promise<SaveFile>; store(file: SaveFile): Promise<void> }
export function createSaves(store: KeyValueStore): Saves

// src/app/store.ts
export interface AppState {
  ready: boolean
  life: Life | null
  openCategory: CategoryId | null
  playing: { def: ActivityDef; mods: Modifiers } | null
  lastResult: { def: ActivityDef; tier: ResultTier; entry: JournalEntry } | null
  birthday: number | null
  boot(saves?: Saves): Promise<void>
  startDemoLife(seed?: number): void     // Plan 1 only: a life that starts at 15. Plan 4 replaces it with the roll screen.
  open(category: CategoryId | null): void
  begin(activityId: string): void        // a blocked activity is ignored; one with no mini-game finishes at once as Good
  finish(score: number): void            // acts once per activity
  closeResult(): void
  ageUp(): void
  endBirthday(): void
}
export const useApp
```

- [ ] **Step 1: Write the failing tests**

```ts
// src/engine/save/saves.test.ts
it('stores and reads a save', async () => {
  const saves = createSaves(memoryStore())
  expect(await saves.load()).toEqual(EMPTY_SAVE)
  const file: SaveFile = { version: 1, active: testLife(), past: [] }
  await saves.store(file)
  expect(await saves.load()).toEqual(file)
})
it('starts fresh and keeps the bad data aside when a save is damaged or from a newer version', async () => {
  for (const bad of [{ checksum: 'wrong', file: { version: 1, active: testLife(), past: [] } }, 'not a save', { checksum: 'x', file: { version: 99 } }]) {
    const store = memoryStore()
    await store.set('save', bad)
    expect(await createSaves(store).load()).toEqual(EMPTY_SAVE)
    expect(await store.get('save-damaged')).toEqual(bad)
  }
})
```

```ts
// src/app/store.test.ts
const fresh = async () => { const store = memoryStore(); const saves = createSaves(store); useApp.setState(useApp.getInitialState()); await useApp.getState().boot(saves); return saves }
const flush = () => new Promise((r) => setTimeout(r, 0))

it('boots empty, then starts a life at 15', async () => {
  await fresh()
  expect(useApp.getState()).toMatchObject({ ready: true, life: null })
  useApp.getState().startDemoLife(7)
  expect(useApp.getState().life!.age).toBe(15)
})
it('plays an activity once, journals it and saves it', async () => {
  const saves = await fresh()
  const app = useApp.getState
  app().startDemoLife(7)
  const before = app().life!.stats.health
  app().begin('jog')
  expect(app().playing!.def.id).toBe('jog')
  app().finish(0.9)
  app().finish(0.9)                                   // a second press must do nothing
  expect(app().life!.stats.health).toBe(Math.min(100, before + 5))
  expect(app().lastResult!.tier).toBe('great')
  expect(app().life!.journal.at(-1)!.kind).toBe('activity')
  await flush()
  expect((await saves.load()).active).toEqual(app().life)
  app().closeResult()
  expect(app()).toMatchObject({ playing: null, lastResult: null })
})
it('finishes an activity with no mini-game at once, and ignores a blocked one', async () => {
  await fresh()
  const app = useApp.getState
  app().startDemoLife(7)
  app().begin('clothes')
  expect(app().playing).toBeNull()
  expect(app().lastResult!.tier).toBe('good')
  app().closeResult()
  app().begin('motorbike')
  expect(app()).toMatchObject({ playing: null, lastResult: null })
})
it('ages up, shows the birthday and closes the sheet', async () => {
  await fresh()
  const app = useApp.getState
  app().startDemoLife(7)
  app().open('body')
  app().ageUp()
  expect(app()).toMatchObject({ birthday: 16, openCategory: null })
  expect(app().life!.age).toBe(16)
  app().endBirthday()
  expect(app().birthday).toBeNull()
})
it('comes back after a reload', async () => {
  const store = memoryStore()
  const saves = createSaves(store)
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(saves)
  useApp.getState().startDemoLife(7)
  await flush()
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(saves)
  expect(useApp.getState().life!.age).toBe(15)
})
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/engine/save src/app/store.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`saves.ts` keeps `{ checksum: checksumOf(file), file }` under the key `save`. `load` never throws: anything missing, mis-shaped, failing its checksum or newer than `SAVE_VERSION` is copied to `save-damaged` and `EMPTY_SAVE` is returned. `settings.ts` follows Golden Thread's `settings.ts`, including its guarded localStorage. The store saves `{ version: 1, active: life, past: [] }` after `startDemoLife`, `finish` and `ageUp`, without waiting for it. With no argument, `boot` uses `createSaves(indexedDbStore('life-sim', 'saves'))`. `finish` acts only while something is being played and no result is showing.

- [ ] **Step 4: Verify**

Run: `npm test && npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add settings, saves and the app's state"
```

---

### Task 10: The skins and the year screen

**Files:**
- Create: `src/styles/base.css`, `src/styles/flat.css`, `src/styles/pixel.css`, `src/app/skin.ts`
- Create: `src/ui/Icon.tsx`, `src/ui/StatBar.tsx`, `src/ui/Changes.tsx`
- Create: `src/screens/year/YearScreen.tsx`, `Rail.tsx`, `Journal.tsx`, `Dock.tsx`, `ActivitySheet.tsx`, `Birthday.tsx`
- Modify: `src/app/App.tsx`, `src/main.tsx`
- Test: `src/screens/year/YearScreen.test.tsx`

**Interfaces:**
- Consumes: the store (Task 9), art helpers (Task 4), engine functions (Tasks 3, 6).
- Produces: `applySkin(skin: Skin): void` from `src/app/skin.ts`; `YearScreen`; `Icon({ id, fallback, small? })`; `StatBar({ stat, value, minor? })` rendering `role="meter"` with `aria-label` and `aria-valuenow`; `Changes({ changes })` rendering one chip per change.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/screens/year/YearScreen.test.tsx
const start = async () => {
  useSettings.getState().update({ reducedMotion: 'on' })
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(createSaves(memoryStore()))
  useApp.setState({ life: testLife({ age: 16 }) })
  render(<App />)
}
it('shows who you are and what you can do', async () => {
  await start()
  expect(screen.getByRole('heading', { name: 'Raka Pratama' })).toBeTruthy()
  expect(screen.getByRole('meter', { name: 'Health' }).getAttribute('aria-valuenow')).toBe('58')
  expect(screen.getAllByRole('meter')).toHaveLength(6)
  expect(screen.getByText('Rp 215.000')).toBeTruthy()
  expect(screen.getByText('10 of 10 left')).toBeTruthy()
  for (const name of ['School', 'Mind', 'Body', 'Health', 'People', 'Money', 'Fun', 'Rest']) expect(screen.getByRole('button', { name })).toBeTruthy()
  expect(screen.getByRole('button', { name: /Turn 17/ })).toBeTruthy()
})
it('opens a category and explains what is closed', async () => {
  await start()
  await userEvent.click(screen.getByRole('button', { name: 'Money' }))
  expect(screen.getAllByRole('button', { name: /energy|Rp|No energy|From age/ }).length).toBeGreaterThanOrEqual(6)
  const bike = screen.getByRole('button', { name: /Buy a motorbike/ }) as HTMLButtonElement
  expect(bike.disabled).toBe(true)
  expect(bike.textContent).toContain('From age 17, with a SIM C licence')
})
it('rests, and shows the change in the journal', async () => {
  await start()
  act(() => useApp.setState({ life: testLife({ energySpent: 5 }) }))
  await userEvent.click(screen.getByRole('button', { name: 'Rest' }))
  await userEvent.click(screen.getByRole('button', { name: /Sleep in/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Back to your year' }))
  expect(screen.getByText('8 of 10 left')).toBeTruthy()
  expect(screen.getByText('Energy +3')).toBeTruthy()
})
it('ages up', async () => {
  await start()
  await userEvent.click(screen.getByRole('button', { name: /Turn 17/ }))
  expect(screen.getByRole('button', { name: /Turn 18/ })).toBeTruthy()
  expect(screen.getByText(/became a KTP/)).toBeTruthy()
})
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/screens`
Expected: FAIL, the screen does not exist.

- [ ] **Step 3: Port the styles**

Move the mockup's stylesheet into three files without changing its values: the base and layout rules and all media queries into `base.css`; the block under "flat illustrated skin" plus the Flat tokens into `flat.css`; the block under "pixel skin" plus the Pixel tokens into `pixel.css`. Replace `/files/…` with the matching `/art/…` names from Task 4. Rules for the illness card, the event dialog and the mini-game are left for the tasks and plans that build them.

- [ ] **Step 4: Build the screen**

Follow the mockup's markup and class names. `App` shows a start panel with one button, `Start a life`, while there is no life (it calls `startDemoLife()`), and `YearScreen` otherwise. It calls `boot()` once on mount and renders nothing until `ready`. `applySkin` sets `data-style` on the root element with transitions switched off for that one update, as the mockup's `setStyle` does. The journal groups entries by age and scrolls to the newest. Activity cards show the icon, title, description and chips for energy, mini-game type, money and times done, or the reason the activity is closed. The result of an activity with no mini-game is shown in a small dialog with the journal line, its changes and `Back to your year`. `Birthday` shows the new age for 1.25 seconds then calls `endBirthday`; with reduced motion it calls it at once.

- [ ] **Step 5: Verify with tests**

Run: `npm test && npm run check`
Expected: PASS.

- [ ] **Step 6: Verify by eye**

Run the dev server and compare with `design/mockup-v2/year-screen-v2.html` in both skins at 1440, 1000 and 680 pixels wide. Expected: the same layout, spacing, type and colours; no sideways scrolling; no console errors.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "Add the two skins and the year screen"
```

---

### Task 11: Playing a mini-game

**Files:**
- Create: `src/minigames/Host.tsx`, `src/minigames/timing/View.tsx`, `src/minigames/themes.ts`, `src/minigames/minigames.css`, `src/app/sound.ts`
- Modify: `src/screens/year/YearScreen.tsx` (mount the host), `src/screens/year/ActivitySheet.tsx` and the store's callers (play sounds)
- Test: `src/minigames/Host.test.tsx`, `src/app/sound.test.ts`

**Interfaces:**
- Consumes: `rulesFor`, `STEP`, `GameInput` (Task 8); `gameClock` (Task 2); the store (Task 9); `gameScenePath` (Task 4); `SKIP_SCORE` (Task 6); `useReducedMotion` (Task 9).
- Produces: `MinigameHost` (no props; reads `playing` and `lastResult`); `play(sound: 'tap' | 'open' | 'ok' | 'good' | 'bad' | 'age'): void`; `THEMES: Record<string, { words?: Partial<Record<ResultTier, string>>; ball?: boolean }>` with an entry for `futsal`; `wordFor(theme: string, tier: ResultTier): string`.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/minigames/Host.test.tsx
const begin = async (id = 'futsal') => {
  useSettings.getState().update({ reducedMotion: 'on' })
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(createSaves(memoryStore()))
  useApp.setState({ life: testLife() })
  useApp.getState().begin(id)
  render(<MinigameHost />)
}
const frame = (ms: number) => act(() => gameClock.tick(ms))

it('stops on Space, applies the result once and offers the way back', async () => {
  await begin()
  frame(0)
  frame(50)                                             // let the marker leave the exact middle
  fireEvent.keyDown(window, { code: 'Space' })
  frame(60)                                             // it stops at about 0.55: a near miss
  expect(useApp.getState().lastResult!.tier).toBe('weak')
  const health = useApp.getState().life!.stats.health
  fireEvent.keyDown(window, { code: 'Space' })
  frame(100)
  expect(useApp.getState().life!.stats.health).toBe(health)
  expect(screen.getByRole('button', { name: 'Back to your year' })).toBeTruthy()
  expect(screen.getByText('Saved')).toBeTruthy()         // the futsal word for a Weak result
})
it('can be skipped for a weak result', async () => {
  await begin('jog')
  await userEvent.click(screen.getByRole('button', { name: 'Skip for a weaker result' }))
  expect(useApp.getState().lastResult!.tier).toBe('weak')
})
it('pauses when the window loses focus', async () => {
  await begin()
  fireEvent.blur(window)
  expect(gameClock.paused).toBe(true)
  fireEvent.focus(window)
  expect(gameClock.paused).toBe(false)
})
it('keeps the game going when the skin changes', async () => {
  await begin()
  frame(0); frame(100)
  const before = screen.getByTestId('marker').style.left
  act(() => useSettings.getState().update({ style: 'pixel' }))
  expect(screen.getByTestId('marker').style.left).toBe(before)
  expect(useApp.getState().lastResult).toBeNull()
})
```

```ts
// src/app/sound.test.ts
it('stays silent without complaint when there is no audio', () => {
  expect(() => (['tap', 'open', 'ok', 'good', 'bad', 'age'] as const).forEach(play)).not.toThrow()
})
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/minigames/Host.test.tsx src/app/sound.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

The host starts the rules from `playing.mods`, starts `gameClock` if it is not running, subscribes to it, and each frame runs as many `STEP`s as the elapsed time holds, passing the inputs gathered since the last frame. Space and Enter are the primary key; arrow keys map to their directions; a press on the play area is a pointer input. When the rules are done it calls `finish(score)` once. `Skip for a weaker result` calls `finish(SKIP_SCORE)`. Window blur pauses the clock and focus resumes it. After the result it shows the theme's word for the result, the journal line with its changes, and `Back to your year`, which calls `closeResult`.

Result words default to `Perfect!`, `Nice!`, `Close` and `Missed`; `futsal` overrides them with `Perfect strike!`, `Goal!`, `Saved` and `Wide`. Port the mockup's mini-game styles and its hit, miss, flash and zoom effects into `minigames.css`; with reduced motion they are skipped. `TimingView` draws the Body scene or a plain panel, the bar with its zone and core, and the marker (`data-testid="marker"`, positioned with `left`). The futsal theme keeps the ball flight from the mockup.

`sound.ts` is the mockup's synth: a triangle wave for Flat and a square wave for Pixel; silent when the sound setting is off or the browser has no audio. Play `tap` on activity press, `open` on opening a category or switching skin, `good`, `ok`, `tap` or `bad` by result, and `age` on ageing up.

- [ ] **Step 4: Verify with tests**

Run: `npm test && npm run check`
Expected: PASS.

- [ ] **Step 5: Verify by eye**

In the dev server, play Futsal practice in both skins. Expected: the marker sweeps smoothly; a hit flashes, zooms and settles; the result and changed stats show; switching skin mid-game does not restart it; switching to another window pauses it.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Add playing a mini-game, with results that land"
```

---

### Task 12: The top bar, settings and keys

**Files:**
- Create: `src/screens/TopBar.tsx`, `src/screens/SettingsDialog.tsx`, `src/app/keys.ts`
- Modify: `src/app/App.tsx`
- Test: `src/screens/TopBar.test.tsx`

**Interfaces:**
- Consumes: `useSettings`, `applySkin`, the store, `play`.
- Produces: `TopBar`; `SettingsDialog`; `installKeys(): () => void`, which adds the keyboard shortcuts and returns a function that removes them.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/screens/TopBar.test.tsx
const start = async () => {
  useSettings.getState().reset()
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(createSaves(memoryStore()))
  useApp.setState({ life: testLife() })
  render(<App />)
}
it('switches skin at once and remembers it', async () => {
  await start()
  await userEvent.click(screen.getByRole('button', { name: 'Pixel' }))
  expect(document.documentElement.dataset.style).toBe('pixel')
  expect(useSettings.getState().style).toBe('pixel')
  expect(screen.getByRole('button', { name: 'Pixel' }).getAttribute('aria-pressed')).toBe('true')
})
it('turns sound, motion and relaxed play on and off', async () => {
  await start()
  await userEvent.click(screen.getByRole('button', { name: 'Sound on' }))
  expect(useSettings.getState().sound).toBe(false)
  await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
  await userEvent.click(screen.getByRole('checkbox', { name: 'Reduce motion' }))
  await userEvent.click(screen.getByRole('checkbox', { name: 'Relaxed mini-games' }))
  expect(useSettings.getState()).toMatchObject({ reducedMotion: 'on', relaxed: true })
})
it('opens categories with 1 to 8 and closes with Escape', async () => {
  await start()
  await userEvent.keyboard('3')
  expect(useApp.getState().openCategory).toBe('body')
  await userEvent.keyboard('{Escape}')
  expect(useApp.getState().openCategory).toBeNull()
  useApp.getState().begin('futsal')
  await userEvent.keyboard('5')
  expect(useApp.getState().openCategory).toBeNull()   // keys do nothing while a mini-game is open
})
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/screens/TopBar.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

The top bar holds the game's name, the two skin buttons (`Flat illustrated`, `Pixel`), a sound button whose label is `Sound on` or `Sound off`, and `Settings`. The settings dialog holds two checkboxes, `Reduce motion` and `Relaxed mini-games`, and the note from spec 5.11: the game is a game, its figures are simplified from listed sources, and it is not medical advice. Number keys follow the order of the current stage's categories. Keys are ignored while a mini-game, a result or the birthday screen is showing.

- [ ] **Step 4: Verify**

Run: `npm test && npm run check && npm run build`
Expected: PASS, and a clean build.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add the top bar, settings and keyboard shortcuts"
```

---

### Task 13: The repo's documents, and publishing the repo

**Files:**
- Create: `README.md`, `AGENTS.md`, `CLAUDE.md`

**Interfaces:**
- Consumes: everything above.
- Produces: a public GitHub repository `Dave03062006/life-sim` with `main` pushed.

- [ ] **Step 1: Write `README.md`**

Sections: what the game is and its three promises; what is playable today (Plan 1) and the seven-plan roadmap; running it (`npm install`, `npm run dev`); checking it (`npm run check`, `npm test`, `npm run build`); the two skins; how art is made (`tools/art/README.md`); where saves live. A section **Long-term goals** that states both, in these words: "Every activity gets its own unique mini-game. Milestone 1 uses six reusable types as a first step." and "A broad catalogue of real conditions, each with cited sources. Milestone 1 ships about 14."

- [ ] **Step 2: Write `AGENTS.md`**

Sections: the folder map from spec 10.3; the commands; the rules in this plan's Global Constraints; how to add an activity (a data entry, an icon id, the content test); the tone rules and anti-goals from the spec; the same two long-term goals; "Commits are made under Dave's account, with no AI co-author line."; pointers to the spec and the plans.

- [ ] **Step 3: Write `CLAUDE.md`**

One line: `@AGENTS.md`.

- [ ] **Step 4: Verify everything once more**

Run: `npm run check && npm test && npm run build`
Expected: no errors; every test passes.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add the README and the guide for AI helpers"
```

- [ ] **Step 6: Check the history carries only Dave's name**

Run: `git log --format="%an <%ae>%n%b" | sort -u`
Expected: one author line, `Dave Tristian Nurcahyo <146943532+Dave03062006@users.noreply.github.com>`, and no `Co-Authored-By`.

- [ ] **Step 7: Publish, once Dave has said yes**

```bash
gh repo create Dave03062006/life-sim --public --source . --remote origin --push --description "A life simulator you play a year at a time."
```

Expected: the repository exists and `main` is pushed. Verify with `gh repo view Dave03062006/life-sim --json visibility,defaultBranchRef`.
