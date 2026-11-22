# Plan 5: School, Work, Money, Marriage and Children — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A life has a path through it. The character goes through TK, SD and SMP, then picks SMA, SMK or work, may sit the entrance test and study one of five fields, and then gets jobs on eight career ladders, with promotions, quitting and retirement. Money comes in and goes out every year: allowance, salary, living costs by lifestyle, university fees, interest, BPJS and debt. Things can be bought and sold. A partner can be proposed to and married, and children arrive and grow up.

**Architecture:** The rules stay pure in `src/life/`, with one new file per subject: `school.ts`, `work.ts`, `money.ts`, `family.ts`, plus `path.ts` for the moves the player makes (enrol, leave, apply, quit, retire) and `requirements.ts` for the shared "what blocks this, and why" check. Careers and belongings are typed content under `src/content/countries/indonesia/`. Age Up now runs in two halves: `closeYear` settles the year that ends (report card, fees, salary, living costs, promotion offers), then death is checked, then `openYear` starts the new one (enrolment, milestones, yearly changes). `Life` goes to save version 4.

**Tech Stack:** As in Plans 1–4.

**Spec:** `docs/superpowers/specs/2026-11-16-life-sim-design.md`, sections 5.2 (the year), 5.4 (yearly changes), 5.5 (job energy), 5.8 (marriage and children), 5.9 (school and work), 5.10 (money), 5.12 (net worth on the summary) and 10.6 (the simulation test, including "no activity is unreachable").

**Dave's decisions for this plan (22 November 2026):**
- Marriage is open to every couple, whatever their genders. This is a game rule, not Indonesian law.
- Children can come once you are married, or after three years with a partner. Adoption comes in a later content pack.
- Living costs start with your first full-time job, or at 25, whichever comes first. Before that you live with family for free.

## Global Constraints

- Commits use Dave's git identity. **No `Co-Authored-By` line and no AI attribution in any commit.**
- TypeScript is strict with `noUncheckedIndexedAccess`. `npm test`, `npm run check` and `npm run build` pass with no warnings and no `act()` warnings.
- `src/life/` is pure: no React, DOM, `Date` or `Math.random`. All randomness comes from `createRng(life.rng)`, and the advanced state is written back to `life.rng`.
- **No arbitrary locks.** Every closed option shows its reason, and every limit says what would open it ("Finish SMA, SMK or Paket C first.", "You need Rp 10.000.000. You have Rp 2.500.000."). Gates are only physical, legal, financial, or something the player can work towards.
- Amounts are realistic Rupiah for present-day Indonesia, shown with `formatRupiah`. Every salary, fee and price in content carries a one-line source comment (a regulation, an official page or a job-listing survey) checked when it is written. The values below are the plan's starting figures; a source that disagrees by more than about 30% wins, and the change is reported.
- The tone is clean, funny and grounded. No crime, drugs, sex or gore. No religion is assigned to the character; weddings are written without a religious ceremony. Nothing is copied from BitLife.
- Colours come from skin tokens only. Keyboard and pointer both work. Every new control is reachable by keyboard and has a visible focus ring. Dialogs make the page behind them inert.
- Oxlint rejects `expect(value, message)`, expects inside conditionals, and bare `toThrow()`.

## Review Focus

1. **An old save keeps playing.** A version 3 save of a 30-year-old loads as someone who finished SD, SMP and SMA, has no job, lives with family until 25 or a full-time job, and can open the job board at once. A 9-year-old loads in SD, year 4. (Task 1)
2. **Leaving school too early says why.** Before SMP is finished, "Leave school" is shown blocked with "You can leave school once SMP is finished." After leaving, the first category reads **Work**, enrolled-only activities are gone, and evening class and the entrance test remain. (Task 2)
3. **Years with no income never trap the player.** Past 25 with no job, living costs push money below zero. Each year in debt adds 5 Stress and says so in the journal, the job board stays open, and Frugal lifestyle is always choosable. (Task 4)
4. **Selling something a job needs is blocked.** An ojek driver cannot sell the motorbike: "Your job as an ojek driver needs it. Quit first." (Task 4)
5. **A spouse or child who dies leaves nothing broken.** A waiting wedding or baby event with them in its cast is skipped through `dropStale`, and a dead child's yearly cost stops. (Task 6)

---

### Task 1: Save version 4 and shared requirements

**Files:**
- Create: `src/life/requirements.ts`
- Modify: `src/life/types.ts`, `src/content/types.ts`, `src/life/year.ts` (`newLife` defaults only), `src/life/testLife.ts`, `src/life/activities.ts` (`check` uses `blockedBy`), `src/engine/save/saves.ts`, `src/app/store.ts` (version number only), `src/content/countries/indonesia/index.ts` (empty `careers` and `belongings`)
- Test: `src/life/requirements.test.ts`, `src/engine/save/saves.test.ts`

**Interfaces:**

```ts
// src/life/types.ts
export type SchoolLevel = 'tk' | 'sd' | 'smp' | 'sma' | 'smk' | 'paket-c' | 'uni'
export type Field = 'engineering' | 'health' | 'education' | 'business' | 'arts'
export interface Schooling {
  at: SchoolLevel | null      // where you are enrolled now
  year: number                // years done at `at`
  effort: number              // study points this year (Task 2)
  grade: number | null        // the last report card, 0-100
  done: SchoolLevel[]         // finished levels, in order
  field: Field | null         // the university field you study or studied
  funding: 'scholarship' | 'family' | 'self' | null // while at uni
}
export interface Job { careerId: string; step: number; performance: number; years: number } // performance 0-100; years in this step
export type Lifestyle = 'frugal' | 'normal' | 'comfortable'
export type Relation = /* existing */ | 'spouse' | 'child'
export interface Person { /* existing fields */ since?: number } // your age when they became your partner or spouse
export interface Life {
  version: 4
  /* …all version 3 fields… */
  school: Schooling
  job: Job | null
  lifestyle: Lifestyle
  ownWay: boolean       // living costs apply (first full-time job, or 25)
  flags: string[]       // lasting facts: 'bank', 'bpjs', 'passed-entrance'
  belongings: string[]  // belonging ids you own
}

// src/content/types.ts
export type Requirement =
  | /* existing 'min-age' and 'stat' */
  | { kind: 'max-age'; age: number; reason: string }
  | { kind: 'school'; levels: SchoolLevel[]; reason: string } // enrolled in or finished one of these
  | { kind: 'field'; field: Field; reason: string }           // finished uni in this field
  | { kind: 'flag'; flag: string; reason: string }
  | { kind: 'no-flag'; flag: string; reason: string }
  | { kind: 'owns'; item: string; reason: string }
  | { kind: 'job'; reason: string }                            // you hold a job
export interface ContentPack { /* existing */ careers: CareerDef[]; belongings: BelongingDef[] } // empty arrays until Tasks 3 and 4
// CareerStep, CareerDef (Task 3's block) and BelongingDef (Task 4's block) are added to this file now, exactly as written there

// src/life/requirements.ts
/** The first unmet requirement's reason, or null. Stat requirements are left to callers that show an openNote. */
export function blockedBy(life: Life, reqs: readonly Requirement[]): string | null
export const finished = (life: Life, ...levels: SchoolLevel[]): boolean
```

- [ ] **Step 1: Write the failing tests.** `requirements.test.ts`: each new kind blocks with its own reason and passes when met; `school` passes while enrolled at a listed level and after finishing one; `max-age` blocks at age 36 for `age: 35`. `saves.test.ts`: a version 3 life of age 30 upgrades to `school.done` `['tk','sd','smp','sma']`, `at: null`, `job: null`, `lifestyle: 'normal'`, `ownWay: true`, `flags: []`, `belongings: []`; age 9 upgrades to `at: 'sd', year: 3`; age 16 to `at: 'sma', year: 1`; age 3 to `at: null, done: []`; partners gain `since: life.age`; a version 1 file still upgrades through 2 and 3 to 4.
- [ ] **Step 2: Run them and see them fail.** `npx vitest run src/life/requirements.test.ts src/engine/save` → FAIL.
- [ ] **Step 3: Implement.** The upgrade's school by age: under 4 nothing; 4–5 `tk` (year age−4); 6–11 `sd` (age−6) with `tk` done; 12–14 `smp` (age−12); 15–17 `sma` (age−15); 18+ all four done. `newLife` gives the same school for its `startAge`, `ownWay: startAge >= 25`. `activities.ts`'s `check` calls `blockedBy` for everything but `stat`, keeping its current order (age first, then companion, then stats, then price).
- [ ] **Step 4: Run all tests.** `npm test` → PASS. `npm run check` → clean.
- [ ] **Step 5: Commit.** `git commit -m "Move saves to version 4 with school, job, money and belongings fields"`

---

### Task 2: School, the SMP fork, the entrance test and university

**Files:**
- Create: `src/life/school.ts`, `src/life/path.ts`
- Modify: `src/life/year.ts` (split into `closeYear` / `openYear`), `src/life/activities.ts` (`track`, `sets`, effort), `src/life/events.ts` (`Outcome.path`), `src/content/types.ts`, `src/content/countries/indonesia/activities.ts`, `events.ts`, `milestones.ts`, `src/minigames/quiz/rules.ts` and `src/minigames/themes.ts` (question count), `src/screens/year/labels.ts`
- Test: `src/life/school.test.ts`, `src/life/path.test.ts`, `src/life/year.test.ts`, `src/minigames/quiz/rules.test.ts`, `src/content/content.test.ts`

**Interfaces:**

```ts
// src/content/types.ts
export interface ActivityDef { /* existing */
  track?: 'enrolled' | 'work' // enrolled: shown only while at school; work: shown from 15 when not enrolled, blocked without a job. Absent: always shown
  sets?: string              // a flag set on a Good or Great result
  performance?: number       // job performance, scaled like a benefit (Task 3)
  buys?: string              // a belonging id (Task 4)
}
export interface Outcome { /* existing */ path?: string } // a path move taken when this outcome lands; skipped if blocked
// themes.ts: ThemeDef.quiz gains count?: number (default 5); QuizView.total becomes number

// src/life/school.ts
export const LENGTH: Record<SchoolLevel, number> // tk 2, sd 6, smp 3, sma 3, smk 3, paket-c 1, uni 4
export const STUDY_TARGET = 3
export const UNI_FEE = 10_000_000          // a year, paid when funding is 'self'
export const SCHOLARSHIP = { smarts: 80, grade: 80 }
export function reportCard(life: Life): number // round(0.6 * smarts + 0.4 * 100 * min(1, effort / STUDY_TARGET))
export function closeSchoolYear(life: Life): Life // report card line and effects, fee, year+1, finishing a level
export function openSchoolYear(life: Life, pack: ContentPack): Life // automatic enrolment; queues 'after-smp'
export function schoolLabel(life: Life): string | null // 'SMA, year 2' · 'University, business, year 1' · null

// src/life/path.ts
export interface PathAction { id: string; label: string; detail: string; blocked: string | null }
export function pathActions(life: Life, pack: ContentPack): PathAction[] // school moves here; work moves join in Task 3
export function takePath(life: Life, id: string, pack: ContentPack): Life // throws on a blocked or unknown id; adds a journal line

// src/life/year.ts
export function ageUp(life: Life, pack: ContentPack): Life // closeYear → death check → openYear
// src/screens/year/labels.ts
export function categoryLabel(life: Life, category: CategoryId): string // 'School' while enrolled, else 'Work'
```

Rules, with the values to use:
- **Enrolment is automatic** through compulsory school: TK at 4, SD at 6 (with or without TK), SMP straight after SD. Each opens with a journal line.
- **Report card.** At each Age Up while enrolled, the journal shows "Your report card: 78." A mark of 80 or more gives Happiness +3. A mark below 40 gives Happiness −3 and Stress +3. Nobody repeats a year. A Weak, Good or Great result in a `track: 'enrolled'` activity adds `TIER_SCALE[tier]` to `effort`. `effort` resets each year.
- **Finishing.** When `year` reaches `LENGTH`, the level joins `done`, `at` becomes null, and the journal says "You finished SMP." (or "You graduated in business." for university).
- **The SMP fork.** Finishing SMP queues the choice event `after-smp`, with three actions: "Go on to SMA", "Go on to SMK" and "Start working". Every outcome of each action carries `path: 'sma'`, `'smk'` or `'leave-school'`. Its weight is 0, so it is never drawn at random.
- **Path moves** (ids):
  - `sma` and `smk`: open with SMP done and not enrolled.
  - `leave-school`: open while at SMA or SMK. While at TK, SD or SMP it is blocked with "You can leave school once SMP is finished."
  - `paket-c`: from 18, without SMA, SMK or Paket C. One year, and it counts as finishing upper secondary school.
  - `uni:<field>` (×5): needs the flag `passed-entrance` and one of `sma`, `smk`, `paket-c` done. It is open at any age (adults may go back), except while at school or in that field already.
  - `leave-uni`: open while at uni.
- **Funding**, decided at enrolment and shown in the move's detail:
  - **Scholarship** with Smarts 80+ and a last grade of 80+.
  - **Family** when wealth is Comfortable or Well off.
  - **Self** otherwise, paying `UNI_FEE` at each Age Up. Debt is allowed.
- **Entrance test.** A School activity `entrance-test`: a quiz with `count: 10` and theme `entrance`, energy 3, stages late teen to senior. It requires `min-age` 17 and `school: ['sma','smk','paket-c']`. It `sets: 'passed-entrance'` and gives Smarts +2.
- **Tracks.** These activities get `track: 'enrolled'`: homework, study-exam, osis, group-project, bimbel, skip-class, class-test and read-ahead. The School category lists `enrolled` activities only while enrolled, and `work` activities only when not enrolled and 15 or older. The rest show as before.
- **Milestone 15** no longer says SMA starts. Write: "You turned 15. SMP is behind you, and everyone has an opinion about what comes next."

- [ ] **Step 1: Write the failing tests.**
  - `school.test.ts`:
    - A life ageing 3→4→…→15 enrols at TK, SD and SMP in turn, and queues `after-smp` at 15.
    - `reportCard` is 60 at Smarts 100 with no effort, and 100 at Smarts 100 with effort 3.
    - Self-funded uni takes `UNI_FEE` each year and graduates after 4.
    - A scholarship takes nothing.
  - `path.test.ts`:
    - `leave-school` is blocked with the exact SMP reason at 13, and open at 16 in SMA.
    - The five `uni:` moves are blocked with "Pass the entrance test first." until the flag is set.
    - `paket-c` opens at 18 for a life that left after SMP.
  - `year.test.ts`: `closeYear` runs before the death check, so a life that dies still gets its last report card.
  - `rules.test.ts`: a quiz with `count: 10` shows 10 questions and scores out of 10.
  - `content.test.ts`: `after-smp` exists with three actions, and every outcome of each has a `path`.
- [ ] **Step 2: Run them and see them fail.** `npx vitest run src/life src/minigames/quiz src/content` → FAIL.
- [ ] **Step 3: Implement** the rules above. `resolveEvent` calls `takePath` for an outcome's `path` when `pathActions` shows that move open.
- [ ] **Step 4: Run all tests.** `npm test` → PASS. `npm run check` → clean.
- [ ] **Step 5: Commit.** `git commit -m "Add school years, report cards, the SMP fork, the entrance test and university"`

---

### Task 3: Careers, the job board, promotions and retirement

**Files:**
- Create: `src/life/work.ts`, `src/content/countries/indonesia/careers.ts`
- Modify: `src/life/path.ts`, `src/life/energy.ts`, `src/life/year.ts`, `src/life/activities.ts` (`performance`), `src/life/events.ts` (`{job}` and `{next}` in `fill`), `src/content/types.ts`, `src/content/countries/indonesia/activities.ts`, `events.ts`, `index.ts`
- Test: `src/life/work.test.ts`, `src/life/path.test.ts`, `src/life/energy.test.ts`, `src/content/content.test.ts`

**Interfaces:**

```ts
// src/content/types.ts
export interface CareerStep { title: string; salary: number; hours: 'full' | 'part'; requires?: Requirement[] } // salary: Rp a year
export interface CareerDef { id: string; name: string; minAge: number; steps: CareerStep[]; business?: true; startCost?: number }

// src/life/work.ts
export const RESERVE = { full: 4, part: 2 }
export const PERFORMANCE_START = 50, PERFORMANCE_DRIFT = -10, PROMOTE_AT = 70, LET_GO_BELOW = 20, PROMOTE_AFTER = 2
export const RETIRE_AGE = 58
export function currentStep(life: Life): { career: CareerDef; step: CareerStep } | null
export function jobBoard(life: Life, pack: ContentPack): PathAction[] // one 'job:<careerId>' per career, entry step, with salary and hours in detail
export function closeWorkYear(life: Life, pack: ContentPack): Life // salary, drift, years+1, then a promotion offer or being let go
export function jobLabel(life: Life): string | null // 'Office clerk' · null
```

**The eight ladders** (yearly salary; part-time marked; sources checked in Step 3):

| id | Steps | Entry needs |
|---|---|---|
| `shop` | Warung helper 18.000.000 (part) → Shop assistant 30.000.000 → Shift supervisor 45.000.000 → Store manager 84.000.000 | 15+ |
| `office` | Office clerk 48.000.000 → Admin officer 66.000.000 → Supervisor 108.000.000 → Manager 180.000.000 | 18+, SMA/SMK/Paket C |
| `teaching` | Honorary teacher 18.000.000 → Teacher 54.000.000 → Senior teacher 78.000.000 → Head teacher 108.000.000 | uni in education |
| `nursing` | Nurse 54.000.000 → Senior nurse 78.000.000 → Head nurse 108.000.000 | uni in health |
| `software` | Junior developer 84.000.000 → Developer 144.000.000 → Senior developer 240.000.000 → Tech lead 360.000.000 | 18+, SMA/SMK/Paket C, Smarts 70 (no degree needed) |
| `driving` | Ojek driver 36.000.000 (part) → Courier 48.000.000 → Delivery team lead 72.000.000 | 17+, owns `motorbike` |
| `civil` | CPNS trainee 48.000.000 → Civil servant 66.000.000 → Section head 96.000.000 → Division head 144.000.000 | 18–35 to apply, SMA/SMK/Paket C |
| `business` | Stall owner 30.000.000 → Shop owner 90.000.000 → Company owner 240.000.000 | 18+, `startCost` 10.000.000 |

The top step of every ladder except `business` also needs Reputation 60, with the reason "Needs Reputation 60 or more." No other step adds needs.

Rules:
- **Applying.** `job:<id>` succeeds at once when you qualify. It replaces any job you hold ("You left your job as Warung helper."). A full-time job is blocked while at TK–SMK with "Finish or leave school first." A full-time job sets `ownWay`. Starting a business pays `startCost`.
- **Other moves.** `quit` is open with a job. `retire` is open from `RETIRE_AGE` with a job, writes "You retired from …", and is never forced. You can still apply for jobs after retiring.
- **Energy.** `energyBudget` subtracts `RESERVE[hours]` for the current step, never below `MIN_BUDGET`. `ageUp`'s Stress fall is 5 instead of 10 while full-time.
- **Each year** (`closeWorkYear`):
  1. Salary is paid. A business pays `salary × (0.4 + performance / 100 × 1.2)`, rounded to Rp 1.000.
  2. Performance drifts by `PERFORMANCE_DRIFT`.
  3. If performance is `PROMOTE_AT` or more, a next step exists, its requirements are met and `years >= PROMOTE_AFTER`, the choice event `promotion` is queued. Its actions are "Accept", "Ask for a bigger raise" and "Turn it down". Accepting, and a success or mixed result on the raise, carry `path: 'promote'`. A successful raise also pays a bonus of 10% of the new salary. Turning it down changes nothing.
  4. Otherwise, below `LET_GO_BELOW`, the job ends with the big news line "You were let go from your job as {job}." and the memory `let-go`.
- **Work activities**, with `track: 'work'` and the blocked reason "You don't have a job. Try the job board.":

  | Activity | Mini-game | Energy | Performance | Other effects | Notes |
  |---|---|---|---|---|---|
  | `extra-hours` | tapping | 2 | +8 | Stress +3 | |
  | `help-colleague` | memory | 1 | +4 | Reputation +2 | |
  | `pitch-idea` | quiz | 2 | +10 | | Smarts 60 |
  | `clear-inbox` | typing | 1 | +4 | Stress −1 | |
  | `team-lunch` | none | 1 | | Happiness +2, Reputation +2 | Rp 50.000 |
  | `slack-off` | timing | 0 | −5 | Happiness +2 | energyBack 1; performance is a cost, not a benefit |
- **Six thin work news events**, each needing a job (a new `Condition` `{ kind: 'job' }`), tone-checked.

- [ ] **Step 1: Write the failing tests.**
  - `work.test.ts`:
    - A clerk at performance 80 with `years: 2` gets `promotion` queued at Age Up, and accepting moves to Admin officer at performance 50.
    - Performance 15 ends the job with the let-go line.
    - A business at performance 50 pays 30.000.000 × 1.0.
    - Salary is added in `closeYear`.
  - `path.test.ts`:
    - `job:software` is blocked at Smarts 65 with the Smarts reason.
    - `job:civil` is blocked at 36 with "The civil service test is open up to age 35."
    - `job:office` at 16 in SMA is blocked with the school reason.
    - `retire` is blocked at 57 with "You can retire from 58.".
  - `energy.test.ts`: a full-time job takes 4 from 12, a part-time one 2, and the floor is 2.
  - `content.test.ts`: 8 careers; each has 3–4 steps with rising salaries; every step requirement has a reason.
- [ ] **Step 2: Run them and see them fail.** `npx vitest run src/life src/content` → FAIL.
- [ ] **Step 3: Implement**, and source the salaries. Check each entry salary against UMP/UMK 2025 (Jakarta Rp 5.396.761 a month, Central Java Rp 2.169.349) and a job-listing survey, and put a one-line source comment above each career.
- [ ] **Step 4: Run all tests.** `npm test` → PASS. `npm run check` → clean.
- [ ] **Step 5: Commit.** `git commit -m "Add eight career ladders, the job board, promotions and retirement"`

---

### Task 4: Money: allowance, living costs, interest, debt, BPJS and belongings

**Files:**
- Create: `src/life/money.ts`, `src/content/countries/indonesia/belongings.ts`
- Modify: `src/life/year.ts`, `src/life/activities.ts` (`buys`, `sets`), `src/life/energy.ts` (belonging energy), `src/life/summary.ts` (net worth), `src/content/countries/indonesia/activities.ts`, `index.ts`
- Test: `src/life/money.test.ts`, `src/life/summary.test.ts`, `src/content/content.test.ts`

**Interfaces:**

```ts
// src/content/types.ts
export interface BelongingDef { id: string; name: string; price: number; resale: number; energy?: number; livingCut?: number }

// src/life/money.ts
export const ALLOWANCE: Record<Wealth, number> // a year, ages 6-11: struggling 250_000, getting-by 600_000, comfortable 1_500_000, well-off 3_000_000; doubled 12-17
export const LIFESTYLE: Record<Lifestyle, { label: string; cost: number; happiness: number; health: number }>
  // frugal 24_000_000 / -2 / -1 · normal 42_000_000 / 0 / 0 · comfortable 84_000_000 / +3 / +1
export const OWN_WAY_AGE = 25
export const CHILD_COST = 9_000_000   // a year per child under 18
export const INTEREST = 0.02          // on positive money, with the 'bank' flag
export const BPJS_PREMIUM = 420_000   // a year from 18, with the 'bpjs' flag (kelas 3, Rp 35.000 a month)
export const DEBT_STRESS = 5
export function closeMoneyYear(life: Life, pack: ContentPack): Life // one journal line totalling the year, then debt Stress
export function setLifestyle(life: Life, lifestyle: Lifestyle): Life
export function sellBlocked(life: Life, itemId: string, pack: ContentPack): string | null
export function sell(life: Life, itemId: string, pack: ContentPack): Life
export function netWorth(life: Life, pack: ContentPack): number // money plus the resale value of belongings
```

Rules:
- **The yearly order** in `closeMoneyYear`:
  1. Allowance comes in while 6–17 and not full-time.
  2. Living costs go out once `ownWay`, which is set at `OWN_WAY_AGE` if not before. A belonging's `livingCut` lowers them.
  3. Child costs go out.
  4. The BPJS premium goes out.
  5. Interest comes in, rounded to Rp 1.000.
  6. If money is now below zero, Stress rises by `DEBT_STRESS` and the journal says "You are in debt: Rp −3.500.000."

  One journal line lists the year's money, for example "This year: salary Rp 48.000.000, living costs Rp 42.000.000.". Its `changes` hold the total.
- **Lifestyle** also moves Happiness and Health by its row each year. It is choosable at any time once `ownWay`. Before that the Money sheet says "You live with your family. Costs start with your first full-time job or at 25."
- **Belongings:**

  | Belonging | Price | Resale | Effect |
  |---|---|---|---|
  | `motorbike` | 4.500.000 | 3.000.000 | energy +1 |
  | `car` | 150.000.000 | 100.000.000 | energy +1, needs `min-age` 17 |
  | `house` | 600.000.000 | 600.000.000 | `livingCut` 15.000.000 |

  The existing `motorbike` activity gains `buys: 'motorbike'`; add `buy-car` and `buy-house` as Money activities for young adults and older. Buying what you own is blocked with "You already have one." `sell` adds the resale value and a journal line. Selling is blocked while the job needs the item (Review Focus 4).
- **Flags.** `save-bank` gains `sets: 'bank'`. A new Health activity `join-bpjs` (from 18, no mini-game, `requires` `no-flag: 'bpjs'` with "You are already in BPJS.") sets `bpjs`. Treatment discounts come in Plan 6.
- **Summary.** `summaryOf` uses `netWorth`.

- [ ] **Step 1: Write the failing tests.**
  - `money.test.ts`:
    - A well-off 13-year-old gains 6.000.000.
    - A 26-year-old with no job on Normal goes from 0 to −42.000.000 and gains 5 Stress.
    - A clerk on Frugal with a house nets 48.000.000 − 9.000.000.
    - Interest on Rp 10.000.000 with `bank` is 200.000, and nothing without the flag.
    - A child of 17 costs, a child of 18 does not.
    - `sellBlocked` gives the driving reason.
    - The year's line lists salary and living costs.
  - `summary.test.ts`: net worth adds a motorbike's 3.000.000.
  - `content.test.ts`: every `buys` names a belonging, and every belonging has resale ≤ price.
- [ ] **Step 2: Run them and see them fail.** `npx vitest run src/life src/content` → FAIL.
- [ ] **Step 3: Implement**, and source the BPJS premium, a typical UKT band (for `UNI_FEE`) and the vehicle prices in comments.
- [ ] **Step 4: Run all tests.** `npm test` → PASS. `npm run check` → clean.
- [ ] **Step 5: Commit.** `git commit -m "Settle money each year: allowance, living costs, interest, debt, BPJS and belongings"`

---

### Task 5: The path panel, the job board and the money panel

**Files:**
- Create: `src/screens/year/PathPanel.tsx`, `src/screens/year/JobBoard.tsx`, `src/screens/year/MoneyPanel.tsx`
- Modify: `src/screens/year/ActivitySheet.tsx`, `src/screens/year/Dock.tsx` (`categoryLabel`), `src/screens/year/Rail.tsx`, `src/app/store.ts`, the skins' CSS
- Test: `src/screens/year/PathPanel.test.tsx`, `src/screens/year/MoneyPanel.test.tsx`, `src/app/store.test.ts`

**Interfaces:**

```ts
// src/app/store.ts
takePath(id: string): void        // ignored when blocked; saves
setLifestyle(lifestyle: Lifestyle): void
sell(itemId: string): void
jobBoardOpen: boolean; setJobBoardOpen(open: boolean): void
```

- **School/Work sheet.** The top shows the status (`schoolLabel` or `jobLabel`, otherwise "No job yet"), then the open and blocked path moves as buttons. A blocked move is disabled and shows its reason. A **Job board** button opens `JobBoard`, a dialog listing `jobBoard` rows: title, salary a year, hours, and the reason when closed. Choosing one asks "Take the job as Office clerk?" through `ConfirmDialog` when it replaces a current job, and otherwise takes it at once.
- **Money sheet.** The top shows the lifestyle as a three-option radio group with each cost and effect, or the "You live with your family…" line. Belongings are listed with a Sell button (resale value shown, disabled with its reason).
- **Rail.** One line under the name shows `schoolLabel ?? jobLabel`, when there is one.
- **The dock** uses `categoryLabel`.

- [ ] **Step 1: Write the failing tests.**
  - `PathPanel.test.tsx`:
    - A 13-year-old sees "Leave school" disabled with its reason.
    - A 20-year-old with no job opens the job board and takes Warung helper, and the rail shows it.
    - Replacing a job asks first.
  - `MoneyPanel.test.tsx`:
    - Choosing Frugal updates the life.
    - Sell on a motorbike adds Rp 3.000.000.
    - A 20-year-old with no job sees the "live with your family" line.
  - `store.test.ts`: `takePath` on a blocked id changes nothing.
- [ ] **Step 2: Run them and see them fail.** `npx vitest run src/screens src/app` → FAIL.
- [ ] **Step 3: Implement**, with focus rings, keyboard use and an inert page behind the job board.
- [ ] **Step 4: Run all tests and the build.** `npm test`, `npm run check` and `npm run build` → all pass.
- [ ] **Step 5: Check in the browser** with the `life-sim` preview at 680 and 1440 px in both skins:
  - Age a life to 15 and pick SMK.
  - Leave school, take a job and buy a motorbike.
  - Switch to the ojek job and see Sell blocked.
- [ ] **Step 6: Commit.** `git commit -m "Show the path panel, the job board and the money panel"`

---

### Task 6: Marriage and children

**Files:**
- Create: `src/life/family.ts`
- Modify: `src/life/personActions.ts` (`propose`), `src/life/people.ts` (relation words), `src/life/events.ts` (`partnered` and `children` conditions, `repeat`, child `addPerson`), `src/life/money.ts` (child cost reads children), `src/content/types.ts`, `src/content/countries/indonesia/events.ts`, `src/screens/year/labels.ts`, `src/screens/year/PeopleList.tsx`, `src/app/store.ts`
- Test: `src/life/family.test.ts`, `src/life/personActions.test.ts`, `src/life/events.test.ts`, `src/content/content.test.ts`

**Interfaces:**

```ts
// src/content/types.ts
export type Condition = /* existing */
  | { kind: 'partnered'; years: number } // a spouse, or a partner for at least `years`
  | { kind: 'children'; max: number }
  | { kind: 'job' }                       // from Task 3
export interface EventDef { /* existing */ repeat?: true } // may be drawn again in a later year
export interface Outcome { /* existing */ addPerson?: { relation: 'crush' | 'child' } }

// src/life/family.ts
export const MARRY_AGE = 19, PROPOSE_CLOSENESS = 70, PARTNER_YEARS = 3, MAX_CHILDREN = 4, BABY_AGE_MAX = 45
export const WEDDING = { small: 15_000_000, big: 80_000_000 }
export function marry(life: Life, personId: string): Life // partner → spouse, since = your age, memory 'married'
export const spouse = (life: Life): Person | undefined
export const children = (life: Life): Person[]

// src/life/personActions.ts
export type PersonActionId = 'time' | 'talk' | 'gift' | 'ask-out' | 'propose'
```

Rules:
- **Propose.** It appears for a partner.
  - It is blocked, in this order: "You need to be 19 to marry." → "{name} needs to be 19 to marry." → "You are not close enough yet." (under 70).
  - It queues the built-in event `propose`, made the way `ask-out` is.
  - On success, `afterEvent` calls `marry` and queues `wedding`, a choice of:
    - "A small family wedding": −15.000.000, Happiness +6.
    - "A big wedding for the whole neighbourhood": −80.000.000, Happiness +8, Reputation +5.
    - "Just sign the papers": 0, Happiness +3.

    Money may go negative.
  - There is no gender check.
- **Partners** gain `since` when ask-out succeeds.
- **Relation words.** Spouse is "wife" or "husband" and child is "daughter" or "son", in `peopleDeaths` and `relationLabel`. The spend-time games are timing for a spouse and catch for a child.
- **The baby event** `baby-talk` is `repeat`, for young adults and adults, and needs:
  - `partnered` with `years: 3`.
  - `children` with `max: 3`, so at most `MAX_CHILDREN`.
  - Age 45 or under.
  - The cast `{ them: 'spouse' }`, or a partner when there is no spouse (two event entries are fine).

  Its actions are "Try for a baby" (chance 75; success adds a child aged 0, closeness 80, with a random gender and a free name, plus the line "{child} was born."), "Wait a few years" and "We're happy as we are". The last sets the memory `no-kids`, and later draws need `no-memory: 'no-kids'`.
- **Repeat events.** `drawEvents` lets a `repeat` event be drawn again, but not twice in one year.
- **Family events.** Four thin choice or news events for spouses and children (a child's first day at SD, a spouse's bad week), tone-checked.

- [ ] **Step 1: Write the failing tests.**
  - `family.test.ts`: `marry` sets the spouse and `since`.
  - `personActions.test.ts`: the three propose reasons, in order.
  - `events.test.ts`:
    - `baby-talk` is not drawn after 2 years with a partner, and can be after 3.
    - A success adds a child aged 0.
    - A repeat event comes back in a later year.
    - A waiting `wedding` whose spouse died is dropped.
  - `money.test.ts`: two children under 18 cost 18.000.000.
  - `content.test.ts`: every `repeat` event has a `children` or `no-memory` limit.
- [ ] **Step 2: Run them and see them fail.** `npx vitest run src/life src/content` → FAIL.
- [ ] **Step 3: Implement**, with Propose in the People list.
- [ ] **Step 4: Run all tests.** `npm test` → PASS. `npm run check` → clean.
- [ ] **Step 5: Commit.** `git commit -m "Add proposals, weddings, and children who grow up"`

---

### Task 7: The simulator plays a path, and the docs

**Files:**
- Modify: `src/dev/simulate.ts`, `src/dev/simulate.test.ts`, `README.md`, `AGENTS.md`, `docs/superpowers/specs/2026-11-16-life-sim-design.md` (section 4 and section 14)

**Interfaces:**

```ts
// src/dev/simulate.ts
export interface SimLife { life: Life; jobAt30: boolean; moneyAt40: number | null; offered: Set<string> } // offered: activity ids seen unblocked
export function simulateLife(seed: number, pack: ContentPack): SimLife
```

- **What the simulator plays.** Each year, before activities:
  - Without a job, from 18, it takes a random open board job with chance 0.5.
  - With `passed-entrance` and no uni done, it enrols in a random open field with chance 0.5.
  - From 60 it retires with chance 0.3.

  Events already cover the SMP fork.
- **New checks**, over `npm test`'s 1,000 lives:
  - At least 50% hold a job at 30.
  - The median money at 40 is above zero.
  - **No activity is unreachable:** every activity in the pack is offered unblocked in at least one life (spec 10.6). An activity that fails this check gets fixed in content, or ruled on in the ledger with its reason.
- **Existing limits stay:** median death age 65–86, accidents under 5%, health deaths under 30%. `npm run simulate` runs 10,000 lives.
- **Docs:**
  - README's roadmap marks Plan 5 done.
  - AGENTS.md says how to add a career, a belonging and a path move.
  - Spec section 4 lists Dave's three decisions from this plan.
  - Spec section 14 adds the calls this plan made: the ladders and salaries, `UNI_FEE` and funding, the report-card formula, no repeated years, the allowance and lifestyle figures, interest 2%, the debt Stress of 5, and the belongings.

- [ ] **Step 1: Write the failing checks** in `simulate.test.ts`.
- [ ] **Step 2: Run them.** `npx vitest run src/dev` → FAIL until the simulator plays a path.
- [ ] **Step 3: Implement**, then `npm run simulate` and report the numbers.
- [ ] **Step 4: Run everything.** `npm test`, `npm run check` and `npm run build` → all pass.
- [ ] **Step 5: Commit.** `git commit -m "Let the simulator choose schools and jobs, and record Plan 5's calls"`

---

## Left out on purpose

- Break-ups and divorce.
- Adoption.
- Pensions.
- Raises outside promotions.
- Debt interest.
- Treatment discounts from BPJS, which arrive with illness in Plan 6.
- Unique mini-games per career.
- The wide career catalogue, which comes in the content packs.
