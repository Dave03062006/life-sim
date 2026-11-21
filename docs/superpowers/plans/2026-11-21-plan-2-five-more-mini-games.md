# Plan 2: Five More Mini-games — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every activity plays its own type of mini-game: Tapping, Memory, Quiz (with a starter question bank), Catch and Typing join Timing, all driven by the same host, with your state changing how each one plays.

**Architecture:** Each type is pure rules (`rules.ts`, stepped at 1/120 s, no React) plus a view (`View.tsx`). A registry maps each type to its rules, view, instruction and play-button label, and the existing host plays whatever the registry gives it. Mini-game seeds now come from the life's own generator so a save replays identically.

**Tech Stack:** As Plan 1: Vite, React 19, TypeScript, Zustand, Vitest with Testing Library, Oxlint.

**Spec:** `docs/superpowers/specs/2026-11-16-life-sim-design.md` (section 5.6). Plan 1, for the conventions already in place: `docs/superpowers/plans/2026-11-16-plan-1-foundation-and-playable-year.md`.

## Where this plan sits

Plan 2 of the seven milestone-1 plans. Plan 1 built the year, the store, saves, both skins and the Timing game. After this plan every one of the 46 late-teen activities plays the game type its data names.

## Global Constraints

- Repo root is `C:/Users/DAVE TRISTIAN/Projects/life-sim`. Commits under Dave's git identity. **No `Co-Authored-By` line and no AI attribution in any commit.**
- TypeScript strict with `noUncheckedIndexedAccess`; `npm test`, `npm run check` and `npm run build` pass with no warnings (no React act() warnings).
- Rules files are pure: no React, no DOM, no `Date`, no `Math.random`. All randomness comes from `createRng(seed)` in `src/engine/random.ts`.
- Each mini-game lasts 20 seconds or less at `time = 1`, opens with one line of instruction, can be played with the keyboard or the pointer, and can be skipped.
- Score is a number from 0 to 1; the existing thresholds turn it into a result (fail < 0.25 ≤ weak < 0.5 ≤ good < 0.85 ≤ great).
- No raw colour values in components; colours come from the skin token files. No emoji as icons.
- Nothing copied from BitLife. Quiz facts must be correct; the writer checks each answer.
- oxlint rejects `expect(value, message)`, expects inside conditionals and bare `toThrow()`; tests use equivalent forms.

## Review Focus

1. **Typing must never trigger game shortcuts.** While a Typing game is open, Space and digits are text, and number keys must not open categories. (Task 6)
2. **A game that ends by its timer while the window is in the background** must still give a result once, not freeze. The host already steps on frames; each rules file must end by its own time limit. (Every rules task: "ends by itself" test)
3. **Fast repeated input** (a held key, many taps in one frame) must not break scoring or exceed limits: meters stay within 0–1, a memory answer is not entered twice per press. (Tasks 2, 3)
4. **The same seed gives the same game**, and two activities in a row get different seeds. (Task 1)
5. **Keyboard-only play works for every type**, including choosing answers and pads with 1–4. (Tasks 1, 3, 4)

---

### Task 1: Inputs, modifiers, seeds and the registry

**Files:**
- Modify: `src/minigames/framework.ts`, `src/life/modifiers.ts`, `src/app/store.ts`, `src/minigames/Host.tsx`, `src/minigames/index.ts`, `src/minigames/themes.ts`
- Create: `src/minigames/registry.ts`
- Test: `src/life/modifiers.test.ts`, `src/app/store.test.ts`, `src/minigames/Host.test.tsx`, `src/minigames/index.test.ts`

**Interfaces:**
- Produces, in `framework.ts`:

```ts
export type GameInput =
  | { kind: 'key'; key: GameKey; down: boolean }
  | { kind: 'pointer'; phase: 'down' | 'move' | 'up'; x: number; y: number }
  | { kind: 'choose'; option: number }          // 0-based; keys 1–4 or a click on a choice
  | { kind: 'text'; text: string }              // one character, or '\b' for Backspace
export interface Modifiers {
  wobble: number; speed: number; window: number; time: number
  drain: number       // how fast meters fall; 1 normal
  preview: number     // multiplies quiz time and memory preview time; 1 normal
  eliminate: boolean  // the quiz removes one wrong answer
}
export const NO_MODIFIERS: Modifiers   // { wobble: 0, speed: 1, window: 1, time: 1, drain: 1, preview: 1, eliminate: false }
export interface GameRules<State, View> {
  type: MinigameType
  input: 'keys' | 'text'    // 'text' sends printable keys as text inputs instead of shortcuts
  start(mods: Modifiers, seed: number, theme?: string): State   // theme = the activity's minigame.theme
  step(state: State, inputs: readonly GameInput[]): State
  view(state: State): View
  done(state: State): boolean
  score(state: State): number
}
```

- `registry.ts`:

```ts
export interface GameEntry {
  // oxlint-disable-next-line no-explicit-any -- each game keeps its own state and view types
  rules: GameRules<any, any>
  // oxlint-disable-next-line no-explicit-any
  View: ComponentType<{ view: any; def: ActivityDef; send(input: GameInput): void; effects?: string; children?: ReactNode }>
  instruction: string
  verb?: string   // the play button's label; no button when absent
}
export const GAMES: Record<MinigameType, GameEntry>
```

- `store.ts`: `playing: { def: ActivityDef; mods: Modifiers; seed: number } | null`. `begin` draws the seed from `createRng(life.rng)` with `rng.int(0, 2 ** 31)` and stores the generator's new state back in `life.rng`.
- `themes.ts`: `Theme` gains `instruction?: string` (overrides the type's); `verb` stays.

- [ ] **Step 1: Write the failing tests**

```ts
// src/life/modifiers.test.ts (add)
it('slows the unhealthy and helps the clever', () => {
  const sick = modifiersFor(testLife({ stats: { ...testLife().stats, health: 39 } }), gym, false)
  expect([sick.drain, +sick.speed.toFixed(2)]).toEqual([1.25, 0.85])
  expect(modifiersFor(testLife({ stats: { ...testLife().stats, smarts: 90 } }), gym, false)).toMatchObject({ preview: 1.2, eliminate: true })
  expect(modifiersFor(testLife({ stats: { ...testLife().stats, smarts: 20 } }), gym, false).preview).toBeCloseTo(0.85)
  expect(modifiersFor(testLife(), gym, false)).toMatchObject({ drain: 1, eliminate: false })
  const relaxed = modifiersFor(testLife(), gym, true)
  expect([+relaxed.drain.toFixed(2), +relaxed.preview.toFixed(3)]).toEqual([0.8, 1.365])
})
```

Smarts 64 in `testLife` gives preview `1 + (64 - 50) / 200 = 1.07`; relaxed multiplies it by 1.3, hence 1.365.

```ts
// src/app/store.test.ts (add)
it('draws a different seed for each game from the life, and replays it', async () => {
  await fresh()
  const app = useApp.getState
  app().startDemoLife(7)
  const rng = app().life!.rng
  app().begin('jog')
  const first = app().playing!.seed
  expect(app().life!.rng).not.toBe(rng)
  app().finish(0.6); app().closeResult()
  app().begin('jog')
  expect(app().playing!.seed).not.toBe(first)
  useApp.setState({ life: { ...app().life!, rng }, playing: null, lastResult: null })
  app().begin('jog')
  expect(app().playing!.seed).toBe(first)
})
```

```ts
// src/minigames/index.test.ts (replace the Plan 1 test)
it('gives every type its own entry with an instruction and a verb', () => {
  for (const type of ['timing', 'tapping', 'memory', 'quiz', 'catch', 'typing'] as const) {
    expect(GAMES[type].rules.type).toBe(type)
    expect(GAMES[type].instruction.length).toBeGreaterThan(10)
    expect(GAMES[type].rules.start(NO_MODIFIERS, 1, 'x')).toBeTruthy()
  }
})
```

This last test stays failing until Task 6; mark it `it.todo` in this task and turn it on in Task 7.

Add to `src/minigames/Host.test.tsx` a test named `sends 1–4 as choices and passes the seed and theme to the rules`, written with a fake registry entry: temporarily set `GAMES.quiz = { rules: spyRules, View: () => null, instruction: 'Test instruction here', verb: 'Go' }` (restore after), begin `study-exam`, press `Digit2`, tick the clock, and assert `spyRules.start` was called with `(mods, playing.seed, 'study-exam')` and `spyRules.step` received `{ kind: 'choose', option: 1 }`.

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/life/modifiers.test.ts src/app/store.test.ts src/minigames`
Expected: FAIL on the new tests.

- [ ] **Step 3: Implement**

`modifiersFor` adds: Health below 40 sets `drain *= 1.25` and `speed *= 0.85`; `preview = clamp(1 + (smarts - 50) / 200, 0.85, 1.25)`; Smarts 80 or more sets `eliminate = true`; relaxed also sets `drain *= 0.8` and `preview *= 1.3`. The existing rules stay.

The host takes rules, view, instruction and verb from `GAMES[type]` (theme `instruction`/`verb` override). It calls `start(mods, playing.seed, def.minigame.theme)`. Keys: `Digit1`–`Digit4` and `Numpad1`–`Numpad4` become `{ kind: 'choose', option: n - 1 }`. When `rules.input === 'text'`, every keydown with a one-character `e.key` becomes `{ kind: 'text', text: e.key }` and Backspace becomes `{ kind: 'text', text: '\b' }`; Space is text then, not the primary key, and no other key mapping applies except Escape (which stays unhandled by the game). The play area also forwards `pointermove` as `{ kind: 'pointer', phase: 'move', x, y }`. Views call `send(input)` for clicks on their own controls (answers, pads); `send` goes through the same input-hold check as keys. The Timing view moves into the registry entry unchanged; Timing's rules gain `input: 'keys'`. The futsal ball stays a theme feature for Timing only.

`rulesFor(type)` returns `GAMES[type].rules`; until Tasks 2–6 land, entries for unbuilt types point at the Timing entry.

- [ ] **Step 4: Verify**

Run: `npm test && npm run check && npm run build`
Expected: PASS, and Futsal still plays exactly as before.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Let each mini-game type bring its own rules, view and inputs"
```

---

### Task 2: Tapping

**Files:**
- Create: `src/minigames/tapping/rules.ts`, `src/minigames/tapping/View.tsx`
- Modify: `src/minigames/registry.ts`, `src/minigames/minigames.css`
- Test: `src/minigames/tapping/rules.test.ts`

**Interfaces:**
- Produces: `tapping: GameRules<TappingState, TappingView>` with `input: 'keys'`; `interface TappingView { meter: number; band: [number, number]; elapsed: number; total: number; done: boolean }`.

Rules: the meter starts at 0.5 and falls by `0.35 * drain` per second; each press (primary key down or pointer down) raises it by 0.12, capped at 1, never below 0. The band is centred on `0.6 + 0.1 * wobble * sin(1.3 * t)` with half-width `0.12 * window`. The game lasts `12 * time` seconds. Score is the share of steps the meter spent inside the band.

- [ ] **Step 1: Write the failing tests**

```ts
const play = (mods: Modifiers, pressWhen: (s: TappingView) => boolean) => {
  let s = tapping.start(mods, 1)
  while (!tapping.done(s)) s = tapping.step(s, pressWhen(tapping.view(s)) ? [{ kind: 'key', key: 'primary', down: true }] : [])
  return s
}
it('rewards keeping the meter in the band', () => {
  expect(tapping.score(play(NO_MODIFIERS, () => false))).toBeLessThan(0.3)
  const s = play(NO_MODIFIERS, (v) => v.meter < (v.band[0] + v.band[1]) / 2 - 0.05)
  expect(tapping.score(s)).toBeGreaterThan(0.85)
})
it('keeps the meter between 0 and 1 however fast you tap', () => {
  let s = tapping.start(NO_MODIFIERS, 1)
  for (let i = 0; i < 200; i++) s = tapping.step(s, Array(5).fill({ kind: 'key', key: 'primary', down: true }))
  expect(tapping.view(s).meter).toBe(1)
})
it('drains faster when unhealthy and ends by itself in 12 seconds', () => {
  const fall = (drain: number) => { let s = tapping.start({ ...NO_MODIFIERS, drain }, 1); for (let i = 0; i < 120; i++) s = tapping.step(s, []); return tapping.view(s).meter }
  expect(fall(1)).toBeCloseTo(0.15, 2)
  expect(fall(1.25)).toBeLessThan(fall(1))
  let s = tapping.start(NO_MODIFIERS, 1)
  for (let i = 0; i < 12 * 120; i++) s = tapping.step(s, [])
  expect(tapping.done(s)).toBe(true)
})
it('counts a held key once', () => {
  const a = tapping.step(tapping.start(NO_MODIFIERS, 1), [{ kind: 'key', key: 'primary', down: true }])
  const b = tapping.step(tapping.start(NO_MODIFIERS, 1), [{ kind: 'key', key: 'primary', down: true }, { kind: 'key', key: 'primary', down: true }])
  expect(tapping.view(b).meter - tapping.view(a).meter).toBeCloseTo(0.12)
})
```

The last test documents that each `down` input is one tap (the host already drops key repeats), so two downs in one step are two taps.

- [ ] **Step 2: Run and see it fail.** Run: `npx vitest run src/minigames/tapping` — Expected: FAIL, module not found.

- [ ] **Step 3: Implement the rules, then the view.** The view shows a vertical meter with the band and the current level, a "time left" bar, and uses the category scene like Timing. Instruction: `Tap to keep the meter inside the band until time runs out.` Verb: `Tap`. Register it in `GAMES.tapping`.

- [ ] **Step 4: Verify.** Run: `npm test && npm run check` — Expected: PASS.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "Add the Tapping mini-game"`

---

### Task 3: Memory

**Files:**
- Create: `src/minigames/memory/rules.ts`, `src/minigames/memory/View.tsx`
- Modify: `src/minigames/registry.ts`, `src/minigames/themes.ts`, `src/minigames/minigames.css`
- Test: `src/minigames/memory/rules.test.ts`

**Interfaces:**
- Produces: `memory: GameRules<MemoryState, MemoryView>` with `input: 'keys'`; `interface MemoryView { phase: 'watch' | 'repeat' | 'done'; lit: number | null; entered: number[]; length: number; pads: 4 }`. `Theme` gains `pads?: [string, string, string, string]` (labels shown on the pads; default `['1', '2', '3', '4']`).

Rules: the sequence has 5 pads drawn with `createRng(seed)`. In the watch phase each pad lights for `0.6 * preview` seconds with a `0.2 * preview` second gap; inputs are ignored. In the repeat phase each `choose` input (option 0–3) is one entry; `left/right/up/down` do nothing. The game ends when 5 entries are made or after `10 * time` seconds of the repeat phase. Score: `0.7 * correct / 5 + 0.3 * streak / 5`, where `correct` counts positions that match and `streak` is the length of the correct run from the start.

- [ ] **Step 1: Write the failing tests**

```ts
const watchSteps = (mods = NO_MODIFIERS) => Math.round(5 * 0.8 * mods.preview / STEP)
const sequenceOf = (seed: number) => { /* step through the watch phase recording each `lit` change */ }
it('shows the same sequence for the same seed', () => {
  expect(sequenceOf(3)).toEqual(sequenceOf(3))
  expect(sequenceOf(3)).toHaveLength(5)
})
it('scores a perfect repeat as 1 and ignores input while watching', () => {
  const seq = sequenceOf(3)
  let s = memory.start(NO_MODIFIERS, 3)
  s = memory.step(s, [{ kind: 'choose', option: 0 }])
  expect(memory.view(s).entered).toEqual([])
  for (let i = 0; i < watchSteps(); i++) s = memory.step(s, [])
  for (const p of seq) s = memory.step(s, [{ kind: 'choose', option: p }])
  expect([memory.done(s), memory.score(s)]).toEqual([true, 1])
})
it('values an early mistake less than a late one', () => {
  const seq = sequenceOf(3)
  const wrong = (at: number) => { /* repeat seq but with position `at` changed to (seq[at] + 1) % 4 */ }
  expect(memory.score(wrong(0))).toBeCloseTo(0.7 * 4 / 5)
  expect(memory.score(wrong(4))).toBeCloseTo(0.7 * 4 / 5 + 0.3 * 4 / 5)
})
it('ends by itself ten seconds into the repeat phase', () => {
  let s = memory.start(NO_MODIFIERS, 3)
  for (let i = 0; i < watchSteps() + 10 * 120; i++) s = memory.step(s, [])
  expect(memory.done(s)).toBe(true)
  expect(memory.score(s)).toBe(0)
})
it('watches longer when clever', () => {
  expect(watchSteps({ ...NO_MODIFIERS, preview: 1.2 })).toBeGreaterThan(watchSteps())
})
```

Fill in `sequenceOf` and `wrong` in the test file; they are test helpers, not rules code.

- [ ] **Step 2: Run and see it fail.** Run: `npx vitest run src/minigames/memory` — Expected: FAIL.

- [ ] **Step 3: Implement the rules, then the view.** The view shows four large pads in a 2×2 grid labelled from the theme, lights the active pad while watching, and during repeat makes each pad a button that calls `send({ kind: 'choose', option })`; the keys 1–4 already work through the host. Instruction: `Watch the order the pads light up, then repeat it.` Verb: none (hide the play button for Memory; the pads are the controls). Themes for the six memory activities: `group-project` (`Plan`, `Draw`, `Write`, `Present`), `library` (`History`, `Novels`, `Science`, `Comics`), `chess` (`Knight`, `Bishop`, `Rook`, `Queen`), `silat` (`Block`, `Strike`, `Kick`, `Sweep`), `warung-shift` (`Nasi`, `Soto`, `Es teh`, `Kerupuk`), `comics` (`Hero`, `Villain`, `Panel`, `Speech`).

- [ ] **Step 4: Verify.** Run: `npm test && npm run check` — Expected: PASS.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "Add the Memory mini-game"`

---

### Task 4: Quiz and the starter question bank

**Files:**
- Create: `src/content/quiz/types.ts`, `src/content/quiz/bank.ts`, `src/minigames/quiz/questions.ts`, `src/minigames/quiz/rules.ts`, `src/minigames/quiz/View.tsx`
- Modify: `src/minigames/registry.ts`, `src/minigames/themes.ts`
- Test: `src/content/quiz/bank.test.ts`, `src/minigames/quiz/questions.test.ts`, `src/minigames/quiz/rules.test.ts`

**Interfaces:**

```ts
// src/content/quiz/types.ts
export type QuizSubject = 'maths' | 'science' | 'english' | 'indonesia' | 'general' | 'chat'
export interface QuizQuestion { id: string; subject: QuizSubject; level: 'sd' | 'smp' | 'sma'; prompt: string; choices: [string, string, string, string]; answer: 0 | 1 | 2 | 3 }
export const QUESTIONS: QuizQuestion[]   // from bank.ts

// src/minigames/quiz/questions.ts
export type QuizSource = { kind: 'bank'; subjects: QuizSubject[] } | { kind: 'change' } | { kind: 'arithmetic' }
export function questionsFor(source: QuizSource, seed: number, count: number): QuizQuestion[]

// src/minigames/quiz/rules.ts
export interface QuizView { index: number; total: 5; prompt: string; choices: string[]; picked: number | null; correct: number; timeLeft: number; timeTotal: number; done: boolean }
export const quiz: GameRules<QuizState, QuizView>   // input: 'keys'
```

`Theme` gains `quiz?: QuizSource`. Sources: `study-exam` bank `['maths', 'science', 'english', 'indonesia']`; `bimbel` bank `['maths', 'english']`; `new-friend` bank `['chat']`; `sell-snacks` `{ kind: 'change' }`; `tutor` `{ kind: 'arithmetic' }`. The rules read the source from `THEMES[theme].quiz` in `start` (the `theme` argument from Task 1); an unknown theme uses bank `['general']`.

Rules: five questions; the whole quiz has `20 * time * preview` seconds. A `choose` input picks the answer shown at that position; the next question follows 0.6 s later (inputs ignored meanwhile). With `eliminate`, each question shows three choices: the correct one and two of the wrong ones, chosen with the seed. The game ends after the fifth answer or when time runs out. Score: `0.9 * correct / 5 + (correct > 0 ? 0.1 * timeLeft / timeTotal : 0)`.

Generated questions: `change` asks for the change from a Rp 10.000, Rp 20.000 or Rp 50.000 note for a total of 1–4 snacks priced Rp 2.000–Rp 7.500 in steps of Rp 500, with three nearby wrong amounts; `arithmetic` asks primary-school sums (two numbers 2–12 multiplied, or 10–99 plus or minus 10–99) with three nearby wrong answers. All amounts are formatted with `formatRupiah`. Choices are shuffled with the seed and never repeat.

The bank holds at least 40 questions: at least 6 each of maths, science, english and indonesia at `sma` level, 6 general, and 10 chat. Chat questions ask for the friendliest or most natural reply in a small situation ("Someone new sits next to you at lunch. What do you say?"); the right answer is warm and fitting, the wrong ones rude, odd or off-topic. Indonesia questions cover Indonesian geography, history and culture with facts the writer has checked.

- [ ] **Step 1: Write the failing tests**

```ts
// bank.test.ts
it('has a sound bank', () => {
  expect(QUESTIONS.length).toBeGreaterThanOrEqual(40)
  expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length)
  for (const s of ['maths', 'science', 'english', 'indonesia', 'general'] as const) expect(QUESTIONS.filter((q) => q.subject === s).length).toBeGreaterThanOrEqual(6)
  expect(QUESTIONS.filter((q) => q.subject === 'chat').length).toBeGreaterThanOrEqual(10)
  for (const q of QUESTIONS) expect({ id: q.id, distinct: new Set(q.choices).size }).toEqual({ id: q.id, distinct: 4 })
})
// questions.test.ts
it('draws five different questions from the chosen subjects, the same for the same seed', () => {
  const a = questionsFor({ kind: 'bank', subjects: ['maths'] }, 9, 5)
  expect(a).toEqual(questionsFor({ kind: 'bank', subjects: ['maths'] }, 9, 5))
  expect(new Set(a.map((q) => q.id)).size).toBe(5)
  expect(a.every((q) => q.subject === 'maths')).toBe(true)
})
it('makes change questions whose answer is right', () => {
  for (const q of questionsFor({ kind: 'change' }, 4, 5)) {
    const [, paid, cost] = q.prompt.match(/Rp ([\d.]+) note.*Rp ([\d.]+)/)!.map((x) => Number(x.replaceAll('.', '')))
    expect(q.choices[q.answer]).toBe(formatRupiah(paid! - cost!))
  }
})
// rules.test.ts
it('scores right answers and a little speed', () => { /* answer all five correctly at once: score ≥ 0.9 and ≤ 1 */ })
it('shows three choices to the clever, one of them right', () => { /* eliminate: view.choices has 3 entries and includes the right answer */ })
it('ends by itself when time runs out, scoring what was answered', () => { /* no input for 20 s: done, score 0 */ })
it('ignores answers during the pause after each answer', () => { /* two choose inputs in consecutive steps: only one answer recorded */ })
```

Write the change prompt exactly as `You sell <n> snacks for Rp <total>. They pay with a Rp <note> note. How much change?` so the test's regular expression finds the note and then the total: adjust the regex if needed but keep the assertion.

- [ ] **Step 2: Run and see them fail.** Run: `npx vitest run src/content/quiz src/minigames/quiz` — Expected: FAIL.

- [ ] **Step 3: Implement.** Write the bank, then `questionsFor`, then the rules, then the view: the question, the choices as numbered buttons (`1`–`4` shown on each) that call `send({ kind: 'choose', option })`, the right answer marked after picking, and a time bar. Instruction: `Answer five questions before time runs out. Press 1 to 4 or click.` No play button. Register `GAMES.quiz`.

- [ ] **Step 4: Verify.** Run: `npm test && npm run check` — Expected: PASS.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "Add the Quiz mini-game and a starter question bank"`

---

### Task 5: Catch

**Files:**
- Create: `src/minigames/catch/rules.ts`, `src/minigames/catch/View.tsx`
- Modify: `src/minigames/registry.ts`, `src/minigames/themes.ts`, `src/minigames/minigames.css`
- Test: `src/minigames/catch/rules.test.ts`

**Interfaces:**
- Produces: `catchGame: GameRules<CatchState, CatchView>` (registered as `GAMES.catch`), `input: 'keys'`; `interface CatchView { x: number; width: number; items: { id: number; x: number; y: number; good: boolean }[]; caught: number; hit: number; done: boolean }`. `Theme` gains `catchItems?: { good: string; bad: string }` (labels drawn on the falling items).

Rules: the basket is centred at `x` (starts 0.5) with width `0.16 * window`. Holding left or right (key down until key up) moves it at `0.9 * speed` per second; a pointer down or move sets a target the basket moves toward at the same speed. Items appear every 0.6 s at a seeded x between 0.05 and 0.95; 70% are good. Each falls from y 0 to y 1 in `1.6 / speed` seconds; an item that reaches y ≥ 0.9 within the basket is caught (good) or hits (bad), and is removed either way; items reaching y 1 are removed. The game lasts `15 * time` seconds. Score: `clamp01((caught - hit) / goodSpawned)`, where `goodSpawned` counts good items that have reached y ≥ 0.9 or been caught.

- [ ] **Step 1: Write the failing tests**

```ts
it('drops the same items for the same seed', () => { /* run 3 s twice with seed 5: identical views */ })
it('catches what the basket is under, and a perfect follower scores well', () => {
  // a bot that moves toward the lowest good item: score > 0.7
})
it('loses points for bad items', () => { /* a bot that moves under the lowest bad item: score 0 */ })
it('moves with a held key until it is released, and stays on screen', () => {
  let s = catchGame.start(NO_MODIFIERS, 5)
  s = catchGame.step(s, [{ kind: 'key', key: 'left', down: true }])
  for (let i = 0; i < 240; i++) s = catchGame.step(s, [])
  expect(catchGame.view(s).x).toBeCloseTo(catchGame.view(s).width / 2)
  s = catchGame.step(s, [{ kind: 'key', key: 'left', down: false }])
  const x = catchGame.view(s).x
  s = catchGame.step(s, [])
  expect(catchGame.view(s).x).toBe(x)
})
it('ends by itself after 15 seconds', () => { /* 15 * 120 steps: done */ })
```

- [ ] **Step 2: Run and see it fail.** Run: `npx vitest run src/minigames/catch` — Expected: FAIL.

- [ ] **Step 3: Implement the rules, then the view.** Items are labelled circles in the skin's good and bad colours (add `--good-item` and `--bad-item` tokens to both skin files); the basket is a bar. Instruction: `Move with the arrow keys or the pointer. Catch the good, dodge the bad.` No play button. Themes: `eat-better` (`Sayur` good, `Gorengan` bad), `cook` (`Bawang` good, `Gosong` bad).

- [ ] **Step 4: Verify.** Run: `npm test && npm run check` — Expected: PASS.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "Add the Catch mini-game"`

---

### Task 6: Typing

**Files:**
- Create: `src/minigames/typing/rules.ts`, `src/minigames/typing/View.tsx`
- Modify: `src/minigames/registry.ts`, `src/minigames/themes.ts`, `src/app/keys.ts` (only if needed for Review Focus 1)
- Test: `src/minigames/typing/rules.test.ts`, `src/minigames/Host.test.tsx`

**Interfaces:**
- Produces: `typing: GameRules<TypingState, TypingView>` with `input: 'text'`; `interface TypingView { target: string; typed: string; timeLeft: number; timeTotal: number; done: boolean }`. `Theme` gains `words?: string[]` (at least 8 plain lowercase words).

Rules: the target is 5 words drawn with the seed from the theme's words (default list if absent), joined by single spaces. Each `text` input appends its character; `'\b'` removes the last one. The game ends when the typed length reaches the target length or after `20 * time` seconds. Score: `accuracy * completion`, where accuracy is the share of typed characters that match the target at the same position and completion is `min(1, typed.length / target.length)`. An empty attempt scores 0.

- [ ] **Step 1: Write the failing tests**

```ts
it('scores exact typing as 1 and ends when the text is complete', () => {
  let s = typing.start(NO_MODIFIERS, 2, 'homework')
  for (const ch of typing.view(s).target) s = typing.step(s, [{ kind: 'text', text: ch }])
  expect([typing.done(s), typing.score(s)]).toEqual([true, 1])
})
it('lets Backspace fix a mistake', () => { /* type a wrong char, '\b', then the rest: score 1 */ })
it('scores half the text, all correct, as 0.5', () => { /* type the first half exactly, let time run out: 0.5 within 0.05 */ })
it('ends by itself after 20 seconds', () => { /* no input: done after 20 * 120 steps, score 0 */ })
```

```tsx
// Host.test.tsx (add)
it('sends Space and digits as text in Typing and keeps the year screen keys quiet', async () => {
  // begin 'homework'; press Space and Digit3; the rules received { kind: 'text', text: ' ' } and { kind: 'text', text: '3' }; openCategory is still null
})
```

- [ ] **Step 2: Run and see them fail.** Run: `npx vitest run src/minigames/typing src/minigames/Host.test.tsx` — Expected: FAIL.

- [ ] **Step 3: Implement.** The view shows the target with typed characters marked right or wrong and a caret, and a time bar. No text field is needed: the host turns key presses into text inputs. Instruction: `Type the words shown before time runs out.` No play button. Themes with words: `homework` (school words), `english` (English words), `code` (code words such as `const`, `return`, `true`), `diary` (feeling words).

- [ ] **Step 4: Verify.** Run: `npm test && npm run check` — Expected: PASS.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "Add the Typing mini-game"`

---

### Task 7: Every activity plays its own game

**Files:**
- Modify: `src/minigames/index.ts`, `src/minigames/index.test.ts`, `src/content/content.test.ts`, `README.md`, `AGENTS.md`
- Test: as listed

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Write the failing tests**

Turn on the registry test from Task 1. Add to `content.test.ts`:

```ts
it('gives every mini-game activity a game that is built and a fitting theme', () => {
  for (const a of pack.activities.filter((x) => x.minigame)) {
    const type = a.minigame!.type
    expect({ id: a.id, built: GAMES[type].rules.type }).toEqual({ id: a.id, built: type })
    if (type === 'quiz') expect({ id: a.id, has: !!THEMES[a.id]?.quiz }).toEqual({ id: a.id, has: true })
  }
})
```

Rewrite the conditional expect without a conditional (filter the quiz activities first, then assert).

- [ ] **Step 2: Run and see it fail, then wire `rulesFor` and the registry so no type falls back to Timing.**

- [ ] **Step 3: Update the documents.** README's playable list names all six game types. AGENTS.md gains "How to add a mini-game type": rules in `src/minigames/<type>/rules.ts` with tests, a view, a registry entry, and the long-term goal (a unique game per activity) restated.

- [ ] **Step 4: Verify in the browser.** Start the dev server and play one activity of each type in both skins at the pane's width and at 1440 px: each opens with its instruction, plays by keyboard and by pointer, can be skipped, and lands a result with its word and numbers. No console errors.

- [ ] **Step 5: Verify and commit.** Run: `npm test && npm run check && npm run build` — Expected: PASS. Then `git add -A && git commit -m "Give every activity its own mini-game type"`.
