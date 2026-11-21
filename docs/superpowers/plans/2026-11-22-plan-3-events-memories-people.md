# Plan 3: Events, Memories and People — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ageing up brings one to three events; choice events are answered with a "what" and a "how"; outcomes can leave memories that come back later; and the People category lists your family, friends and crush, with things to do with each of them.

**Architecture:** People, memories and pending events live on the `Life` record (save version 2, with an upgrade from version 1). Events are typed data read by a pure engine in `src/life/events.ts`. The store queues events after the birthday screen and blocks other actions until they are answered. React only draws the dialogs and lists.

**Tech Stack:** As Plans 1–2.

**Spec:** `docs/superpowers/specs/2026-11-16-life-sim-design.md`, sections 5.7 (events) and 5.8 (people). Visual reference for the event dialog: the event veil in `design/mockup-v2/year-screen-v2.html` (banner, situation, "What do you do?" and "How?" rows, `Decide`).

## Global Constraints

- Commits under Dave's git identity. **No `Co-Authored-By` line and no AI attribution in any commit.**
- TypeScript strict with `noUncheckedIndexedAccess`; `npm test`, `npm run check` and `npm run build` pass with no warnings.
- `src/life/` is pure: no React, DOM, `Date` or `Math.random`; all randomness from `createRng(life.rng)`, writing the advanced state back to `life.rng`.
- Every unavailable option states its reason; options open only to you show why ("Open to you: Reputation 60+", "Open to you: your choice at 15").
- Clean, funny, grounded tone. No crime, drugs, sex or gore. No religion assigned to the character. Nothing copied from BitLife.
- Colours from skin tokens only; keyboard and pointer both work; dialogs trap nothing behind them (the page behind is inert, as Plan 1 established).
- oxlint rejects `expect(value, message)`, expects inside conditionals and bare `toThrow()`.

## Review Focus

1. **Loading a Plan 1–2 save** must upgrade it (family generated, nothing lost), never start fresh. (Task 1)
2. **Ageing up twice quickly, or reloading with events waiting,** must not lose or duplicate events: pending events are saved and shown after reload. (Task 3)
3. **A person named in an event who has since left** (a friend who drifted away) must not crash the event: the event is skipped when its cast is missing. (Task 2)
4. **The romance question** is asked once, before the first romance option, and never again unless changed in Settings. (Task 3)
5. **Event outcomes keep stats and closeness within 0–100.** (Task 2)

---

### Task 1: People on the life, and the save upgrade

**Files:**
- Modify: `src/life/types.ts`, `src/life/year.ts`, `src/life/testLife.ts`, `src/engine/save/saves.ts`
- Create: `src/life/people.ts`, `src/content/countries/indonesia/names.ts`
- Test: `src/life/people.test.ts`, `src/life/year.test.ts`, `src/engine/save/saves.test.ts`

**Interfaces:**

```ts
// src/life/types.ts
export type Relation = 'mother' | 'father' | 'sibling' | 'grandparent' | 'friend' | 'crush' | 'partner'
export interface Person { id: string; name: string; relation: Relation; gender: Gender; age: number; closeness: number }
export interface Memory { id: string; age: number; text: string; people: string[] }   // people = person ids
export type Interest = 'women' | 'men' | 'both' | 'none'
export interface PendingEvent { eventId: string; cast: Record<string, string> }       // role → person id
export interface JournalEntry { age: number; kind: 'milestone' | 'activity' | 'event' | 'memory'; text: string; changes: Change[] }
export interface Life {
  version: 2
  // …all Plan 1 fields…
  people: Person[]
  memories: Memory[]
  interest: Interest | null       // null until the romance question is answered
  pendingEvents: PendingEvent[]
  seenEvents: string[]            // event ids already drawn in this life
  spentWith: string[]             // person ids you spent time with this year
}

// src/life/people.ts
export const MAX_FRIENDS = 8
export function newFamily(rng: Rng, playerAge: number, names: NameLists): Person[]
export function startingFriend(rng: Rng, playerAge: number, names: NameLists): Person | null   // a friend for lives that start at 12 or older
export function addPerson(life: Life, person: Person): Life   // a ninth friend pushes out the least close friend
export function changeCloseness(life: Life, personId: string, delta: number): Life   // clamped 0–100; unknown id is a no-op
export function personById(life: Life, id: string): Person | undefined
export function yearlyPeople(life: Life): Life   // everyone ages one year; closeness −3 for anyone not in spentWith; spentWith cleared

// src/content/countries/indonesia/names.ts
export interface NameLists { female: string[]; male: string[] }
export const NAMES: NameLists   // at least 30 each, common Indonesian given names
```

Family rules: mother aged player + 22–35, father player + 24–38; 0–3 siblings with ages within 10 years of the player (none older than the mother minus 18); each of four grandparents alive with probability 0.6, aged their child + 20–30, and only if that age is under 90. Starting closeness: parents 70, siblings 55, grandparents 60, starting friend 60. The starting friend is a same-age schoolmate of the player's gender. Person ids are `p-` plus a counter stored in the ids (`p-1`, `p-2`, …), unique within a life. A person's name is never the player's name.

`newLife` builds the family (and, for `startAge` 12 or more, the starting friend) from the same generator after rolling stats, and sets the new fields to empty. `ageUp` calls `yearlyPeople` after the stat changes. `testLife()` gains a mother, a father and a friend named `Dimas` (id `p-3`, closeness 60), and empty memories, null interest and empty lists.

Save upgrade: `SAVE_VERSION` becomes 2. `load` accepts files of version 1 or 2; a version 1 active life is upgraded by generating its family (and starting friend when 12 or older) from its own `rng`, setting the new fields, writing back the advanced `rng`, and `version: 2`. Past lives are upgraded the same way. A file newer than 2 is still kept aside as damaged.

- [ ] **Step 1: Write the failing tests**

```ts
// people.test.ts
it('builds a believable family from a seed', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const fam = newFamily(createRng(seed), 15, NAMES)
    const mother = fam.find((p) => p.relation === 'mother')!
    expect(mother.age >= 37 && mother.age <= 50).toBe(true)
    expect(fam.filter((p) => p.relation === 'sibling').length).toBeLessThanOrEqual(3)
    expect(fam.filter((p) => p.relation === 'grandparent').every((g) => g.age < 90)).toBe(true)
    expect(new Set(fam.map((p) => p.id)).size).toBe(fam.length)
  }
  expect(newFamily(createRng(4), 15, NAMES)).toEqual(newFamily(createRng(4), 15, NAMES))
})
it('keeps at most eight friends, dropping the least close', () => { /* add 9 friends with closeness 10..90: the closeness-10 one is gone */ })
it('clamps closeness and ignores unknown people', () => { /* +50 on 60 → 100; −200 → 0; unknown id: life unchanged */ })
it('ages everyone and lets unseen people drift', () => {
  const life = yearlyPeople(testLife({ spentWith: ['p-3'] }))
  expect(personById(life, 'p-3')!.closeness).toBe(60)
  expect(personById(life, 'p-1')!.closeness).toBe(testLife().people[0]!.closeness - 3)
  expect(life.spentWith).toEqual([])
  expect(personById(life, 'p-1')!.age).toBe(testLife().people[0]!.age + 1)
})
// saves.test.ts
it('upgrades a version 1 save instead of starting fresh', async () => {
  // store a valid version-1 file (life without the new fields, version 1); load: version 2 life with a mother and father, same stats and journal
})
```

- [ ] **Step 2: Run and see them fail.** Run: `npx vitest run src/life src/engine/save` — Expected: FAIL.
- [ ] **Step 3: Implement** as specified above.
- [ ] **Step 4: Verify.** Run: `npm test && npm run check` — Expected: PASS (existing tests updated only where they build a version 1 life).
- [ ] **Step 5: Commit.** `git add -A && git commit -m "Give every life a family, friends and a save upgrade"`

---

### Task 2: The event engine

**Files:**
- Modify: `src/content/types.ts`, `src/content/index.ts`
- Create: `src/life/events.ts`
- Test: `src/life/events.test.ts`

**Interfaces:**

```ts
// src/content/types.ts
export type Condition =
  | { kind: 'stat'; key: StatKey; min?: number; max?: number }
  | { kind: 'memory'; id: string }            // you have this memory
  | { kind: 'no-memory'; id: string }
  | { kind: 'money'; min: number }
export interface Outcome {
  text: string                                 // may use {role} placeholders, e.g. {friend}
  effects?: Partial<Record<StatKey, number>>
  money?: number
  closeness?: Partial<Record<string, number>>  // role → change
  memory?: { id: string; text: string }        // recorded with the cast's people
}
export type MannerKind = 'calm' | 'blunt' | 'joke'
export interface EventAction {
  id: string; label: string; chance: number    // 0–100
  open?: { condition: Condition; note: string } // shown only when met; the note says why ("Open to you: your choice at 15")
  romance?: boolean                            // needs the romance question answered first
  outcomes: Record<'success' | 'mixed' | 'fail', Outcome>
}
export interface EventDef {
  id: string; kind: 'choice' | 'news'; stages: StageId[]; weight: number; big?: boolean
  when?: Condition[]
  cast?: Record<string, Relation>              // roles to fill, e.g. { friend: 'friend' }
  title: string; text: string
  recall?: { memory: string; text: string }    // a "Remembered" line added when you have the memory
  actions?: EventAction[]                      // choice events, 2–5
  manners?: { id: string; label: string; kind: MannerKind }[]   // default: Calmly / Bluntly / With a joke
  news?: Outcome                               // news events
}
// ContentPack gains: events: EventDef[]

// src/life/events.ts
export const DEFAULT_MANNERS: { id: string; label: string; kind: MannerKind }[]   // calm 'Calmly', blunt 'Bluntly', joke 'With a joke'
export type EventTier = 'success' | 'mixed' | 'fail'
export function drawEvents(life: Life, pack: ContentPack): Life
export function availableActions(life: Life, ev: EventDef, cast: Record<string, string>): { action: EventAction; openNote: string | null }[]
export function rollTier(life: Life, chance: number, manner: MannerKind, rng: Rng): EventTier
export function resolveEvent(life: Life, pack: ContentPack, actionId: string, mannerId: string): { life: Life; tier: EventTier; entry: JournalEntry }
export function fill(text: string, life: Life, cast: Record<string, string>): string
```

`drawEvents` (pure, uses and advances `life.rng`): draws 1 event with probability 0.5, 2 with 0.35, 3 with 0.15, from events whose stage matches, whose `when` conditions all hold, which are not in `seenEvents`, and whose cast can be filled (each role picks a random person with that relation; the event is skipped if none exists). At most one `big` event. Weighted by `weight`. News events apply at once: their outcome's effects, money and closeness, a memory if any, and a journal entry of kind `event`. Choice events go to `pendingEvents` in draw order. Drawn ids join `seenEvents`.

`rollTier`: `roll = chance + shift + luck`, where luck is `rng.int(-20, 21)`; shift is 0 for calm and blunt, and for joke `roundAway((happiness − 50) / 2 + (reputation − 50) / 4)`. `roll ≥ 60` success, `≥ 35` mixed, else fail.

`resolveEvent` resolves the first pending event: rolls the tier; scales the outcome's stat effects and closeness by the manner (calm ×0.75 and an extra Stress −2; blunt ×1.5; joke ×1.25 on a fail, else ×1), rounding half away from zero; money is not scaled; applies them clamped; records the memory with the cast's person ids; writes a journal entry of kind `event` whose text is the filled outcome text and whose changes are the real changes (after minus before); adds a `memory`-kind entry with `Remembered` text first if the event has a `recall` and you have that memory; removes the event from `pendingEvents`. Throws if nothing is pending or the action is not available.

- [ ] **Step 1: Write the failing tests** (with a small test pack defined in the test file, not the real content)

```ts
it('draws one to three fitting events, never repeats one, and at most one big', () => { /* 200 lives: counts in 1..3, no id twice in seenEvents, ≤1 big */ })
it('skips an event whose cast cannot be filled', () => { /* event casting 'crush' with no crush: never drawn */ })
it('applies news at once and queues choices', () => { /* news effects in stats and journal; choice in pendingEvents */ })
it('rolls tiers from chance, manner and luck, the same for the same seed', () => {
  // chance 100 calm: always success; chance 0 calm: never success; joke at happiness 90/reputation 90 beats joke at 10/10 over 500 rolls
})
it('scales outcomes by manner and keeps everything within bounds', () => { /* blunt success doubles-ish; calm adds Stress −2; closeness 95 + 20 → 100 */ })
it('records a memory and quotes it back later', () => { /* resolve an event leaving memory 'covered-friend'; a later event with recall 'covered-friend' adds a 'memory' entry first */ })
it('shows options open only to you, with the reason', () => { /* Reputation 60+ action: listed with its note when met, absent when not */ })
it('throws when nothing is pending or the action is closed', () => {
  expect(() => resolveEvent(testLife(), pack, 'a', 'calm')).toThrow(/nothing pending/i)
})
```

- [ ] **Step 2: Run and see them fail.** Run: `npx vitest run src/life/events.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** `ContentPack.events` is `[]` for Indonesia until Task 5.
- [ ] **Step 4: Verify.** Run: `npm test && npm run check` — Expected: PASS.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "Add the event engine and memories"`

---

### Task 3: Events and people in the year

**Files:**
- Modify: `src/app/store.ts`, `src/life/activities.ts`, `src/life/year.ts`
- Create: `src/life/personActions.ts`
- Test: `src/app/store.test.ts`, `src/life/personActions.test.ts`

**Interfaces:**

```ts
// src/life/personActions.ts
export type PersonActionId = 'time' | 'talk' | 'gift' | 'ask-out'
export interface PersonAction { id: PersonActionId; label: string; blocked: string | null; detail: string }
export const GIFT_PRICE = 50_000
export function actionsFor(life: Life, personId: string): PersonAction[]
export function timeActivity(person: Person): ActivityDef   // id `time:<personId>`, category 'people', energy 1, effects { happiness: 3 }, a mini-game suited to the relation
export function giveGift(life: Life, personId: string): { life: Life; entry: JournalEntry }

// src/life/activities.ts
export function finishActivity(life: Life, def: ActivityDef, score: number, personId?: string): ActivityOutcome
// with personId: closeness +8 scaled by the result like a benefit (a fail gives −3), and the person joins spentWith

// src/app/store.ts (additions)
pendingEvent: PendingEvent | null          // derived: life.pendingEvents[0] once the birthday screen has ended
askingInterest: boolean
lastEvent: { def: EventDef; tier: EventTier; entry: JournalEntry } | null
decide(actionId: string, mannerId: string): void
closeEvent(): void
setInterest(interest: Interest): void
personAction(personId: string, action: PersonActionId): void
```

Rules:
- `ageUp` in the store runs the rules' `ageUp`, then `drawEvents`, saves, and shows the birthday. After `endBirthday`, the first pending event shows; `decide` resolves it and shows its result; `closeEvent` moves to the next pending event or back to the year. `begin`, `ageUp` and person actions are refused while an event is pending or showing.
- Pending events are saved with the life, so after a reload the first one shows again once the year screen is up.
- Spend time: suited mini-games are mother and father `catch` (theme `cook`), sibling `tapping`, grandparent `memory` (theme `chess`), friend and crush `tapping`, partner `timing`. It plays through `begin`/`finish` like any activity, with the person id carried in `playing`.
- Talk: queues a built-in choice event `talk` with the person cast as `them` (content in Task 5) and shows it at once.
- Gift: costs `GIFT_PRICE`, closeness +10; blocked with the money reason when you cannot pay.
- Ask out (crush only, closeness 50 or more, age 15 or more): queues the built-in `ask-out` event. A success turns the crush into a `partner`.
- Romance question: before showing any event or person action marked romance, if `life.interest` is null, `askingInterest` becomes true and the dialog asks; the answer is saved and the action continues. Crushes are only cast from people matching the interest; `none` means no romance events are drawn.

- [ ] **Step 1: Write the failing tests**

```ts
it('shows events after the birthday, one at a time, and saves them', async () => { /* ageUp with a pack that always draws a choice event; endBirthday → pendingEvent set; decide → lastEvent; closeEvent → next or null; saved file has pendingEvents until resolved */ })
it('refuses other actions while an event waits', async () => { /* begin('jog') and ageUp() change nothing */ })
it('brings back an unanswered event after reload', async () => { /* reboot: pendingEvent shown once ready */ })
it('spends time with a person through a mini-game', async () => { /* personAction(p-3, 'time') → playing.def.id 'time:p-3'; finish(0.9) → closeness up, Happiness up, spentWith includes p-3 */ })
it('gives a gift only when you can pay', () => { /* money 40000: blocked 'You need Rp 50.000. You have Rp 40.000.' */ })
it('asks who you are interested in once, before the first romance option', async () => { /* interest null + ask-out → askingInterest true; setInterest('women') → continues; second time no question */ })
```

- [ ] **Step 2: Run and see them fail.** Run: `npx vitest run src/app/store.test.ts src/life/personActions.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Verify.** Run: `npm test && npm run check` — Expected: PASS.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "Bring events and people into the year"`

---

### Task 4: The event dialog, the people list, memories on the lifeline

**Files:**
- Create: `src/screens/year/EventDialog.tsx`, `src/screens/year/InterestDialog.tsx`, `src/screens/year/PeopleList.tsx`
- Modify: `src/screens/year/YearScreen.tsx`, `src/screens/year/ActivitySheet.tsx`, `src/screens/year/Journal.tsx`, `src/styles/base.css`, `src/styles/flat.css`, `src/styles/pixel.css`, `src/screens/SettingsDialog.tsx`
- Test: `src/screens/year/EventDialog.test.tsx`, `src/screens/year/PeopleList.test.tsx`, `src/screens/year/Journal.test.tsx`

Behaviour:
- **Event dialog** follows the mockup's event veil: the event banner image if the manifest has one (`events[eventId]`), else a plain panel; the title and situation; "What do you do?" as toggle buttons (the first selected), each open-only-to-you option showing its note underneath; "How?" likewise; `Decide`. After deciding, the same dialog shows the outcome text, its change chips and `Back to your year`. Keys: 1–5 pick an action, Tab moves between rows, Enter decides. Focus starts on the first action. The page behind is inert.
- **Interest dialog:** "Who are you interested in?" with `Women`, `Men`, `Both`, `Nobody yet`. Settings gains a "Romantic interest" choice to change it later.
- **People list:** the People category shows your people above its activities: name, relation (`Mother`, `Father`, `Brother`/`Sister`, `Grandmother`/`Grandfather`, `Friend`, `Crush`, `Partner`), age and a closeness bar (`role="meter"`, labelled with the name). Choosing a person shows their actions with their costs or blocked reasons.
- **Journal:** `event` entries carry the label `Event`; `memory` entries the label `Remembered` (the mockup's `.tagm` style). The lifeline shows one dot per memory at its age, with the memory text as the dot's accessible label and tooltip.

- [ ] **Step 1: Write the failing tests**

```tsx
it('answers an event with a what and a how', async () => { /* render with a pending event; choose action 2 and 'Bluntly'; Decide; outcome text and Back to your year show */ })
it('marks options open only to you', async () => { /* the note 'Open to you: Reputation 60+' is shown under that option */ })
it('lists people with closeness and their actions', async () => { /* open People: 'Dimas' with meter 60; choose Dimas → 'Spend time', 'Talk', 'Give a gift' */ })
it('shows a memory dot on the lifeline', () => { /* life with a memory at 15: a dot labelled with its text */ })
```

- [ ] **Step 2: Run and see them fail.** Run: `npx vitest run src/screens/year` — Expected: FAIL.
- [ ] **Step 3: Implement**, porting the event dialog's look from the mockup into both skins with tokens only.
- [ ] **Step 4: Verify.** Run: `npm test && npm run check && npm run build` — Expected: PASS.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "Show events, people and memories on the year screen"`

---

### Task 5: Late-teen events and the built-in people events

**Files:**
- Create: `src/content/countries/indonesia/events.ts`
- Modify: `src/content/countries/indonesia/index.ts`, `src/content/content.test.ts`, `tools/art/` only if a banner is reused (no new art in this plan)

Content (spec section 6 counts for the late teen stage): **at least 14 choice events and 8 news events** for `late-teen`, plus the built-in `talk` and `ask-out` events usable at any stage from 12. Required among them:
- `class-trip-money` from the mockup: Rp 800.000 missing, the friend suspected; actions Defend {friend}, Stay out of it, Tell the teacher what you saw, Speak for the class (open to you: Reputation 60+), Remind {friend} what they owe you (open to you: your choice at 15, i.e. memory `covered-friend`). Banner `event-class-trip`.
- `cover-for-friend` at 15 that can leave the memory `covered-friend` ("You covered for {friend} when they skipped class").
- One event whose `recall` quotes `covered-friend` ("{friend} has not forgotten that you covered for them.").
- One `romance` event introducing a crush (adds a crush person matching the interest).
- At least one news event that changes money (family hardship or a windfall) and one that changes Health.
- Talk: actions Ask how they are / Share your news / Ask for advice; outcomes change closeness and Happiness.
- Ask out: actions Ask directly / Write a note / Ask through a friend; success makes them your partner, mixed keeps them a crush with closeness up, fail lowers closeness and Happiness.

Each event: Indonesian high-school life, plain English, two to five actions with three outcomes each, chances between 30 and 85 so luck and manner matter, no outcome harsher than the situation warrants.

- [ ] **Step 1: Add content tests**

```ts
it('has enough late-teen events, all well-formed', () => {
  const lt = pack.events.filter((e) => e.stages.includes('late-teen'))
  expect(lt.filter((e) => e.kind === 'choice').length).toBeGreaterThanOrEqual(14)
  expect(lt.filter((e) => e.kind === 'news').length).toBeGreaterThanOrEqual(8)
  // every choice event: 2–5 actions, each with all three outcomes and a non-empty text;
  // every {role} placeholder used in a text exists in the event's cast; every open note is non-empty;
  // every memory referenced by a condition, open or recall is recorded by some outcome
})
```

Write the remaining checks as real assertions over filtered arrays, not conditionals.

- [ ] **Step 2: Run and see it fail, then write the content.**
- [ ] **Step 3: Verify.** Run: `npm test && npm run check` — Expected: PASS.
- [ ] **Step 4: Commit.** `git add -A && git commit -m "Add late-teen events and conversations"`

---

### Task 6: Documents and a browser check

**Files:**
- Modify: `README.md`, `AGENTS.md`

- [ ] **Step 1: Update the documents.** README's playable list adds events, memories and people. AGENTS.md gains "How to add an event" (data shape, cast roles, open-to-you options with notes, memories and recall, the tone rules) and "How people work" (relations, closeness, the eight-friend limit, the romance question).
- [ ] **Step 2: Browser check (controller).** Start a life, age up several times, answer events with different manners, see a memory dot appear and later be quoted, spend time with Dimas, give a gift, answer the romance question, ask out a crush; both skins; no console errors.
- [ ] **Step 3: Verify and commit.** Run: `npm test && npm run check && npm run build` — Expected: PASS. Then `git add -A && git commit -m "Document events, memories and people"`.
