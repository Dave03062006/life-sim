# Plan 4: A Whole Life, Birth to Death — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The player rolls a new life on a title screen and plays it from birth. Every stage has things to do. The player and the people around them can die. Death shows a life summary, finished and abandoned lives stay in a Past lives list, and all saves can be exported and imported.

**Architecture:** The rules stay pure in `src/life/`: rolling a life (`roll.ts`), death odds (`death.ts`) and the summary (`summary.ts`). `Life` goes to save version 3 (family wealth and death), with an upgrade from 1 and 2. The store gains a `screen`, so the app can show Title, New life, Year, Summary and Past lives. A headless simulator in `src/dev/` plays thousands of random lives as a test.

**Tech Stack:** As in Plans 1–3.

**Spec:** `docs/superpowers/specs/2026-11-16-life-sim-design.md`, sections 5.1 (stages), 5.8 (people age and die), 5.12 (death and the life summary), 5.13 (starting a life), 8 (saves, past lives, export and import) and 10.6 (the simulation test).

**Scope note:** the old Plan 4 was too big for one plan, so it is split in two. This plan covers a whole life from birth to death. **Plan 5** covers school, work, money, marriage and children (spec 5.9, 5.10 and the rest of 5.8). Health and disease becomes Plan 6, content and art becomes Plan 7, and checks and publishing become Plan 8.

## Global Constraints

- Commits use Dave's git identity. **No `Co-Authored-By` line and no AI attribution in any commit.**
- TypeScript is strict with `noUncheckedIndexedAccess`. `npm test`, `npm run check` and `npm run build` pass with no warnings, and with no `act()` warnings.
- `src/life/` is pure: no React, DOM, `Date` or `Math.random`. All randomness comes from `createRng(life.rng)`, and the advanced state is written back to `life.rng`.
- Every unavailable option states its reason, and every limit says what would open it.
- The tone is clean, funny and grounded. No crime, drugs, sex or gore. No religion is assigned to the character. Nothing is copied from BitLife. Death is written plainly and kindly, never as a joke about the person who died.
- Colours come from skin tokens only. Keyboard and pointer both work. Every new screen is reachable by keyboard and has a visible focus ring. Dialogs make the page behind them inert, as Plan 1 set up.
- Oxlint rejects `expect(value, message)`, expects inside conditionals, and bare `toThrow()`.

## Review Focus

1. **A death is saved before the summary shows.** A reload after dying opens the title screen with the life in Past lives. It never resumes the dead life. (Task 5)
2. **A blank or whitespace name cannot start a life.** Start is disabled with "Your name can't be empty." Names are trimmed and limited to 40 characters. (Task 4)
3. **Importing a damaged or foreign file leaves the current saves untouched** and shows "That file isn't a life-sim save, or it's damaged." (Task 6)
4. **Starting a new life while one is in progress asks first.** Yes moves the old life to Past lives as unfinished; No goes back and changes nothing. (Task 4)
5. **A person who dies while cast in a waiting event** does not crash the event. It is skipped through the existing missing-cast path. (Task 2)

---

### Task 1: Rolling a life, and save version 3

**Files:**
- Create: `src/life/roll.ts`, `src/content/countries/indonesia/cities.ts`
- Modify: `src/life/types.ts`, `src/life/year.ts`, `src/life/testLife.ts`, `src/engine/save/saves.ts`, `src/app/store.ts` (only `persist`'s version number)
- Test: `src/life/roll.test.ts`, `src/life/year.test.ts`, `src/engine/save/saves.test.ts`

**Interfaces:**

```ts
// src/life/types.ts
export type Wealth = 'struggling' | 'getting-by' | 'comfortable' | 'well-off'
export interface Death { age: number; cause: string }
export interface Life { version: 3; /* …all version 2 fields… */ wealth: Wealth; death: Death | null }

// src/life/roll.ts
export const WEALTH_LABEL: Record<Wealth, string> // 'Struggling', 'Getting by', 'Comfortable', 'Well off'
export interface LifeRoll { seed: number; name: string; gender: Gender; city: string; wealth: Wealth }
export function rollLife(seed: number): LifeRoll
export const MAX_NAME = 40
export function cleanName(name: string): string // trims, collapses inner spaces, cuts to MAX_NAME

// src/life/year.ts
export interface NewLifeOptions { seed: number; startAge?: number; name?: string; gender?: Gender; city?: string; wealth?: Wealth }

// src/engine/save/saves.ts
export const SAVE_VERSION = 3
export interface SaveFile { version: 3; active: Life | null; past: Life[] }
export function parseSave(raw: unknown): SaveFile | null // checksum check plus upgrade; null when invalid (Task 6 uses it for imports)
```

- [ ] **Step 1: Write failing tests**
  - `rollLife(7)` equals `rollLife(7)`.
  - The name has two different given names from the gender's list, for example "Dewi Lestari".
  - The city is in `CITIES`.
  - Over 2,000 seeds, the wealth shares are struggling 25%, getting by 45%, comfortable 22% and well off 8%, each within ±3 points.
  - `rollLife` draws from `createRng(seed ^ 0x9e3779b9)`, so its gender does not correlate with `newLife({ seed })`'s Health. Test: over 2,000 seeds, the mean Health of each gender is within 3 points of the other.
  - `cleanName('  Dewi   Lestari ')` is `'Dewi Lestari'`; a 60-character name comes back with 40.
  - `newLife({ seed, wealth: 'comfortable' })` has `version: 3`, `wealth: 'comfortable'`, `death: null` and `money: 0` when `startAge` is 0. It keeps today's 200 000 when `startAge` is 15 or more.
  - Saves upgrade correctly: a version 1 file, a version 2 file, and a version 2 file holding a version 1 life all load as version 3, with `wealth: 'getting-by'`, `death: null`, and nothing else lost.
  - `parseSave` returns null for a bad checksum, a non-object, and a version above 3.
- [ ] **Step 2: Run the tests.** `npx vitest run src/life/roll.test.ts src/life/year.test.ts src/engine/save/saves.test.ts` FAILS.
- [ ] **Step 3: Implement.**
  - `CITIES` holds 20 real Indonesian cities: Jakarta, Surabaya, Bandung, Medan, Semarang, Makassar, Palembang, Yogyakarta, Denpasar, Malang, Balikpapan, Pontianak, Manado, Padang, Banjarmasin, Pekanbaru, Kupang, Jayapura, Ambon, Mataram.
  - `upgradeLife` chains 1→2→3.
  - `load` uses `parseSave`.
  - `testLife` becomes version 3 with `wealth: 'getting-by'` and `death: null`.
  - `persist` writes `version: 3`.
  - Family members already avoid the player's given names, so keep that.
- [ ] **Step 4: Run the tests.** `npm test` PASSES; `npm run check` is clean.
- [ ] **Step 5: Commit.** "Roll a new life and move saves to version 3"

### Task 2: Death, for you and the people around you

**Files:**
- Create: `src/life/death.ts`, `src/dev/simulate.ts`
- Modify: `src/life/year.ts`, `src/life/people.ts`
- Test: `src/life/death.test.ts`, `src/life/year.test.ts`, `src/dev/simulate.test.ts` (starts with `// @vitest-environment node`)

**Interfaces:**

```ts
// src/life/death.ts
export const OLD_AGE: readonly [from: number, chance: number][] // [[90, 0.30], [80, 0.12], [70, 0.04], [60, 0.01]]
export const ACCIDENT = 0.0005
export const CAUSE = { health: 'Health gave out', oldAge: 'Old age', accident: 'An accident' } as const
export function oldAgeChance(age: number, health: number | null): number // ×0.5 at Health 80+, ×2 below 30; null = no change
export function deathCause(life: Life, rng: Rng): string | null // order: Health 0, old age, accident (spec 5.12; illness joins in Plan 6)

// src/life/people.ts
export function peopleDeaths(life: Life, rng: Rng): Life // everyone else rolls oldAgeChance(age, null) and ACCIDENT

// src/life/year.ts: ageUp keeps its signature
//   1. deathCause at the current age. If a cause comes back: return life with death { age, cause },
//      a 'milestone' journal entry "You died at {age}. {cause}.", the advanced rng, and nothing else.
//   2. Otherwise do today's yearly changes and yearlyPeople, then peopleDeaths.

// src/dev/simulate.ts
export function simulateLife(seed: number, pack: ContentPack): Life
// Rolls a life with rollLife and starts it at age 0. Each year, while energy is left, it plays a random
// unblocked offer from a random open category with a random score. It answers every pending event with a
// random open action and manner, then ages up. It stops at death, or throws at age 130.
```

- [ ] **Step 1: Write failing tests.**
  - `oldAgeChance(59, 50)` is 0.
  - `oldAgeChance(75, 50)` is 0.04, `(75, 85)` is 0.02 and `(75, 20)` is 0.08.
  - Health 0 always dies with `'Health gave out'`.
  - `ageUp` on a dying life keeps `age`, sets `death`, and adds the entry.
  - A grandparent dies when `peopleDeaths` runs on an rng whose first draw is below their chance. Pick a fixed seed and assert it.
  - A dead person is removed. The journal reads "Your grandmother Sri died, aged 84." (the relation word comes from relation and gender: mother, father, sister/brother, grandmother/grandfather, friend, partner). A memory `{ id: 'death-{personId}', text, people: [personId] }` is added.
  - A waiting event whose cast person died is skipped, using the existing `dropStale` and missing-cast path. Add a test only if no existing test covers it.
  - The simulation plays 10,000 lives with seeds 1 to 10,000. None throws. Every life ends with `death` set. The median age at death is between 65 and 82. Fewer than 2% of deaths are accidents. Health causes fewer than 30% of deaths. The test runs in under 60 s: give it that timeout.
- [ ] **Step 2: Run the tests.** `npx vitest run src/life/death.test.ts src/life/year.test.ts src/dev/simulate.test.ts` FAILS.
- [ ] **Step 3: Implement.**
  - Until Task 5 the store keeps playing after a death; that is expected.
  - If the simulation shows an empty category at some stage, fix it in Task 3, not here. Until then the simulator skips empty categories.
  - If the median lands outside 65–82, stop and report the number rather than retuning the spec's odds.
- [ ] **Step 4: Run the tests.** `npm test` PASSES.
- [ ] **Step 5: Commit.** "Let lives end: death odds, people dying, and a life simulator"

### Task 3: Something to do at every age

**Files:**
- Modify: `src/content/countries/indonesia/activities.ts`, `events.ts`, `milestones.ts`, `src/minigames/themes.ts` (new themes only), `src/content/quiz/bank.ts` (only if a level runs short)
- Test: `src/content/content.test.ts`, `src/dev/simulate.test.ts`

**Interfaces:**
- The `a()` helper gains a `stages` parameter. A short form such as `TEEN_UP = ['late-teen', 'young-adult', 'adult', 'senior']` keeps the lines short.
- No engine changes.

- [ ] **Step 1: Write failing content tests.**
  - Every stage has at least **two** offers in each category it opens (spec 5.1). Baby and small child count only their own categories.
  - Every stage has at least two news events, and at least two choice events from early teen up.
  - Milestone lines exist for 0 (birth), 1, 4, 6, 12, 15, 17 (kept), 18, 40 and 60.
  - Every activity still passes the existing "what the screen and the rules need" checks: an icon or category fallback, a built game, a quiz source.
  - Quiz activities for child and early teen draw `sd` and `smp` questions.
  - The simulation now never meets an empty open category. Remove the Task 2 skip.
- [ ] **Step 2: Run the tests.** `npx vitest run src/content` FAILS.
- [ ] **Step 3: Write the content.**
  - First widen `stages` on existing activities that fit other ages, without changing their text. Sleep, a walk, chatting with family and saving money fit, for example. Anything that names SMA, a SIM or a crush stays late-teen.
  - Then write new activities where an age has none. Baby examples: learn to crawl, first words, cry for attention, nap. Small child examples: draw with crayons, play pretend, learn letters. Adults and seniors: a morning walk, a hobby class, gardening, calling a grandchild later. School activities for SD and SMP are neutral, such as "Do your homework" or "Read ahead". Plan 5 adds real school.
  - Aim for the Plan 7 numbers in spec section 6, but the test's minimum is what counts now.
  - Seniors use stage `senior`. Mini-game modifiers already follow your stats.
  - Write two news events per stage. Write two small choice events for early teen, young adult, adult and senior, with no new engine features.
  - Every quiz question you add has a source in a comment, like the existing bank.
  - Keep the tone rules. Babies' journal lines are about the parents' view ("You said 'mama'. Your mother cried a little.").
- [ ] **Step 4: Run the tests.** `npm test` PASSES; the median-age assertion still holds.
- [ ] **Step 5: Commit.** "Add things to do and news for every stage of life"

### Task 4: Title screen and the new-life roll

**Files:**
- Create: `src/screens/Title.tsx`, `src/screens/NewLife.tsx`, `src/screens/ConfirmDialog.tsx`
- Modify: `src/app/store.ts`, `src/app/App.tsx`, `src/screens/TopBar.tsx` (a `Menu` button that opens the title), `src/styles/base.css`
- Test: `src/app/store.newLife.test.ts` (replace the demo-life tests), `src/screens/Title.test.tsx`, `src/screens/NewLife.test.tsx`

**Interfaces:**

```ts
// src/app/store.ts
export type Screen = 'title' | 'new-life' | 'year' | 'summary' | 'past'
interface AppState {
  screen: Screen
  past: Life[]                     // the module-level `past` moves into state
  roll: LifeRoll | null            // only while screen is 'new-life'
  confirmAbandon: boolean
  summaryId: string | null         // life id shown on the summary screen (Task 5)
  goTitle(): void
  newRoll(seed?: number): void     // screen 'new-life', a fresh roll
  editRoll(patch: Partial<Pick<LifeRoll, 'name' | 'gender'>>): void
  startLife(): void                // with an unfinished active life, sets confirmAbandon and waits
  answerAbandon(yes: boolean): void
  continueLife(): void             // screen 'year'
}
// startDemoLife is removed. Boot always lands on 'title'.
// startLife: newLife({ ...roll, name: cleanName(roll.name), startAge: 0 }), then drawEvents, then saveAndShow, then screen 'year'.
```

- [ ] **Step 1: Write failing tests.**
  - Boot with an active life shows the title with **Continue**. Without one, Continue is absent.
  - `newRoll(3)` twice gives the same roll; Re-roll gives a different seed.
  - `editRoll({ name: '   ' })` leaves Start disabled, with the reason "Your name can't be empty." shown beside it.
  - Starting gives age 0, the roll's name, gender, city and wealth, and screen `'year'`.
  - With an active unfinished life, `startLife` only sets `confirmAbandon`.
  - `answerAbandon(false)` changes nothing.
  - `answerAbandon(true)` puts the old life at the end of `past` with `death: null` and starts the new one. Both are persisted in one store write.
  - The NewLife screen shows the country choice (Indonesia, selected; the picker is ready for more), the editable name (`maxLength` 40), the gender toggle, city, family wealth (`WEALTH_LABEL`), the family (names and relations), the starting stats as `StatBar`s, and Re-roll and Start buttons.
  - The stats preview comes from `newLife(options)` for the current roll and edits, so the screen shows what Start will make.
  - Esc on NewLife goes back to the title.
- [ ] **Step 2: Run the tests.** `npx vitest run src/app src/screens` FAILS.
- [ ] **Step 3: Implement.**
  - The confirm dialog reads "Start a new life? {name}, aged {age}, moves to Past lives as unfinished." with the buttons "Start new life" and "Keep playing". Build it as a small reusable `ConfirmDialog` with focus on the safe button, and use it again in Task 6.
  - Lay out both screens with the skin tokens, centred cards like the current start card, so they look right in both skins at 680 px and 1440 px.
- [ ] **Step 4: Run the tests.** `npm test` PASSES.
- [ ] **Step 5: Commit.** "Add the title screen and the new-life roll"

### Task 5: The life summary and Past lives

**Files:**
- Create: `src/life/summary.ts`, `src/screens/Summary.tsx`, `src/screens/PastLives.tsx`
- Modify: `src/app/store.ts`, `src/app/App.tsx`, `src/screens/Title.tsx` (Past lives button with a count)
- Test: `src/life/summary.test.ts`, `src/app/store.death.test.ts`, `src/screens/Summary.test.tsx`

**Interfaces:**

```ts
// src/life/summary.ts
export interface LifeSummary {
  name: string; age: number; ended: 'died' | 'unfinished'; cause: string | null
  memories: Memory[]; stats: Stats; netWorth: number   // money for now; belongings join in Plan 5
  leftBehind: Person[]                                  // living people, closest first
  closing: string
}
export function summaryOf(life: Life): LifeSummary
export const CLOSING_LINES: Record<'young' | 'middle' | 'old' | 'unfinished', string[]> // at least 2 each; young < 30, old 70+
// The closing line is picked by life.rng modulo the list length, so it is stable for a given life.

// src/app/store.ts additions
showPast(): void
showSummary(lifeId: string): void
// ageUp: when the new life has death set, move it to past, set active null, persist { active: null, past },
// then screen 'summary' with summaryId = its id. No birthday screen, and no events.
```

- [ ] **Step 1: Write failing tests.**
  - `summaryOf` on a dead testLife gives `ended: 'died'`, its cause, its memories in age order, and `leftBehind` sorted by closeness.
  - A life with `death: null` gives `'unfinished'` with a null cause.
  - The closing line is the same on repeat calls.
  - In the store, ageing up into death leaves `life` null and `past` ending with the dead life, and the store write holds `active: null`.
  - Booting from that save shows the title with no Continue and "Past lives (1)".
  - The Summary screen shows the name, "Lived {age} years" (or "{age} years so far" when unfinished), the cause, the lifeline with memory dots (reuse the Journal's lifeline), the final stats, the net worth in Rupiah, the people left behind with their relation, and the closing line. It has the buttons "New life" and "Past lives".
  - PastLives lists every past life, newest first, with name, age, and cause or "Unfinished". Each opens its summary. Back goes to the title.
- [ ] **Step 2: Run the tests.** `npx vitest run src/life/summary.test.ts src/app src/screens` FAILS.
- [ ] **Step 3: Implement.** If the Journal's lifeline is not already its own component, pull it out as `Lifeline`.
- [ ] **Step 4: Run the tests.** `npm test` PASSES.
- [ ] **Step 5: Commit.** "Show a life summary at death and keep past lives"

### Task 6: Export and import, and the docs

**Files:**
- Create: `src/app/backup.ts`
- Modify: `src/screens/Title.tsx`, `src/app/store.ts`, `AGENTS.md`, `README.md`
- Test: `src/app/backup.test.ts`, `src/screens/Title.test.tsx`

**Interfaces:**

```ts
// src/app/backup.ts
export function exportText(file: SaveFile): string        // JSON of { checksum, file }, the same shape the store saves
export function importText(text: string): SaveFile | null  // JSON.parse in a try, then parseSave
export function downloadText(filename: string, text: string): void // a Blob and an <a download>; the file is "life-sim-saves.json"

// src/app/store.ts
replaceSaves(file: SaveFile): void // sets the life and past, persists, screen 'title'
```

- [ ] **Step 1: Write failing tests.**
  - `importText(exportText(file))` deep-equals `file`.
  - `importText` returns null for `'nope'`, `'{}'`, a file with one changed character in its body, and a version 4 file.
  - On the title, **Export** calls `downloadText` with the current saves; mock it in the test.
  - **Import** takes a `.json` file. A valid file asks "Replace your current life and past lives with this file?" in the `ConfirmDialog`, and replaces them only on yes.
  - An invalid file shows "That file isn't a life-sim save, or it's damaged." in a `role="alert"` line and changes nothing.
- [ ] **Step 2: Run the tests.** `npx vitest run src/app/backup.test.ts src/screens/Title.test.tsx` FAILS.
- [ ] **Step 3: Implement**, then update the docs.
  - **AGENTS.md:** Plans 1–4 are done. Add `roll.ts`, `death.ts`, `summary.ts`, `src/dev/` and the new screens to the folder map. Say how to add a stage's content. Note that the simulation test is the balance guard. Give the new plan numbering (5: school, work, money and family; 6: health; 7: content and art; 8: checks and publishing).
  - **README.md:** a whole life is playable, saves can be exported and imported, and the roadmap uses the same plan numbering.
- [ ] **Step 4: Run the checks.** `npm test`, `npm run check` and `npm run build` all PASS.
- [ ] **Step 5: Commit.** "Export and import saves, and update the docs"
