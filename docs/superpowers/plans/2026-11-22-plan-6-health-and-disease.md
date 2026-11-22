# Plan 6: Health and Disease — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real illnesses come and go during a life. Each one is data with a real source. Illnesses appear at random by age and risk. Untreated, they follow real outcomes. Treated, they are cured or controlled. Silent ones stay hidden until a check-up or their symptoms give them away. Lifespans across thousands of lives land close to Indonesia's real life expectancy.

**Architecture:**
- **Rules.** Pure rules go in a new `src/life/illness.ts` (onset, symptoms, discovery, resolution, death chance) and `src/life/treatment.ts` (treatments offered in the Health category).
- **Content.** The fourteen starter conditions are typed content in `src/content/countries/indonesia/illnesses.ts`, each carrying its sources.
- **Save.** `Life` goes to save version 5 with a list of current illnesses.
- **The year.** `openYear` rolls new illnesses and applies symptoms. `closeYear` resolves untreated ones. The death check gains the spec's second step, illness, between Health 0 and old age.
- **Screens.** Illnesses show as badges and a tint on the rail, as named effects on mini-games, and as treatment cards in the Health sheet.

**Tech Stack:** As in Plans 1–5.

**Spec:** `docs/superpowers/specs/2026-11-16-life-sim-design.md`, sections 5.11 (health and disease), 5.12 (the death check order), 5.6 (illness effects on mini-games), 5.10 (BPJS), 7.5 and 9.2 (badges and tint rather than new art), 10.6 (every condition has a source; the simulation's lifespan range) and the Sources list.

**Dave's decisions for this plan (22 November 2026):**
- The simulation's median age at death must fall between **70 and 78**. Indonesia's life expectancy at birth was 74.15 in 2024 (BPS, https://www.bps.go.id/en/pressrelease/2024/11/15/2296).
- **Silent illnesses stay hidden until found.** High blood pressure, early diabetes and early cancer stay hidden until a check-up finds them or their symptoms show.
- **The family pays for treatment under 18.** From 18 the player pays, and BPJS covers it.

## Global Constraints

- Commits use Dave's git identity. **No `Co-Authored-By` line and no AI attribution in any commit.** Stage files explicitly.
- TypeScript is strict with `noUncheckedIndexedAccess`. `npm test`, `npm run check` and `npm run build` pass with no warnings and no `act()` warnings.
- `src/life/` is pure: no React, DOM, `Date` or `Math.random`. All randomness comes from `createRng(life.rng)`, and the advanced state is written back.
- **No arbitrary locks.** Every closed treatment shows its reason and what would open it.
- **Medical figures carry sources.** Every condition has at least one source with an `https://` link, and a test fails the build otherwise. Each figure in the content either comes from a cited source, or carries a comment saying it is a game figure sized against that source. Treatment prices are game figures and say so. Nothing is presented as medical advice.
- **Tone.** Illness is written plainly and kindly, never as a joke about the sick person. Light humour about the everyday (bad hospital food, a nosy neighbour bringing soup) is fine. No gore. No HIV, conditions tied to sex or drugs, or depression (spec 5.11).
- Colours come from skin tokens only. Keyboard and pointer both work. Focus rings are visible, and dialogs make the page inert.
- Oxlint rejects `expect(value, message)`, expects inside conditionals, and bare `toThrow()`.

## Review Focus

1. **A child is never priced out of care.** Under 18, every treatment shows "Your family pays" and costs nothing. A baby with acute diarrhoea can always get oral rehydration. (Task 4)
2. **A silent illness never shows its name early.** A player with hidden high blood pressure sees no badge, journal line or treatment card until a check-up or symptoms reveal it. After that, the journal says how it was found. (Tasks 2 and 6)
3. **An illness death is named.** The summary cause and the "You died at…" line give the condition's name, for example "Tuberculosis", not "Health gave out". (Task 3)
4. **Old saves and Plan 5 saves load.** A version 4 life upgrades with no illnesses and plays on. (Task 1)
5. **Treating a controlled illness has to be repeated each year.** Medicine for diabetes controls it for this year only, and the Health card says so: "Controlled this year. Take it again next year." (Task 4)

---

### Task 1: Illness data, save version 5, and the source rule

**Files:**
- Modify: `src/life/types.ts`, `src/content/types.ts`, `src/content/countries/indonesia/index.ts` (empty `illnesses`), `src/life/year.ts` (`newLife`), `src/life/testLife.ts`, `src/engine/save/saves.ts`, `src/app/store.ts` (version only), `src/content/content.test.ts`
- Test: `src/engine/save/saves.test.ts`, `src/content/content.test.ts`

**Interfaces:**

```ts
// src/life/types.ts
export interface Illness {
  id: string          // the IllnessDef id
  since: number       // your age when it started
  stage: number       // 0-based; long illnesses move on each untreated year
  known: boolean      // false while a silent illness is undiscovered
  treated: 'cured' | 'controlled' | 'eased' | null // this year's treatment; reset when the year opens
}
export interface Life { version: 5; /* …all version 4 fields… */ illnesses: Illness[] }

// src/content/types.ts
export interface Source { title: string; url: string }
export type IllnessEffect = 'cure' | 'control' | 'ease'
export interface TreatmentDef { id: string; label: string; place: 'home' | 'puskesmas' | 'hospital'; cost: number; energy: number; effect: IllnessEffect }
export interface IllnessStage { death: number; recover?: number; symptoms?: Partial<Record<StatKey, number>>; energy?: number; silent?: boolean }
export interface IllnessDef {
  id: string; name: string; kind: 'short' | 'long'
  gender?: Gender                        // breast cancer: female
  onset: [fromAge: number, chance: number][] // yearly chance by age band, highest band first, like OLD_AGE
  risk?: { lowHealth?: number; highStress?: number; untreated?: Partial<Record<string, number>> } // multipliers; untreated: another illness id it raises
  vaccine?: string                       // a flag that halves the chance
  symptoms: string                       // plain text for the card
  minigame?: { label: string; mods: Partial<Modifiers> } // "Dengue fever: your aim wobbles"
  stages: IllnessStage[]                 // short illnesses have one stage
  untreated?: { die: [fromAge: number, chance: number][]; weaker?: number; weakerEffects?: Partial<Record<StatKey, number>> } // short illnesses only; required for them (content test)
  treated: { die: number }               // short: chance of death even with care; long: yearly death while controlled
  treatments: TreatmentDef[]
  sources: Source[]
}
export interface ContentPack { /* existing */ illnesses: IllnessDef[] }
```

- [ ] **Step 1: Write the failing tests.**
  - `saves.test.ts`: a version 4 life upgrades to version 5 with `illnesses: []`, and versions 1–3 still chain through.
  - `content.test.ts`: every illness has at least one source whose `url` starts with `https://`, at least one treatment, and onset bands that run from the highest age down. Short illnesses have exactly one stage. The test runs over the pack, which is empty here; Task 5 fills it.
- [ ] **Step 2: Run them and see them fail.** `npx vitest run src/engine/save src/content` → FAIL.
- [ ] **Step 3: Implement** the types, the upgrade (`illnesses: []`), `newLife`, `testLife` and the empty pack field.
- [ ] **Step 4: Run all tests.** `npm test`, then `npm run check` → PASS and clean.
- [ ] **Step 5: Commit.** `git commit -m "Move saves to version 5 with illnesses, and require a source for every condition"`

---

### Task 2: Catching an illness, symptoms, and discovery

**Files:**
- Create: `src/life/illness.ts`
- Modify: `src/life/year.ts` (`openYear`), `src/life/energy.ts`, `src/life/modifiers.ts`, `src/life/activities.ts` (check-up discovery), `src/content/countries/indonesia/activities.ts` (`checkup`, `immunisation`)
- Test: `src/life/illness.test.ts`, `src/life/energy.test.ts`, `src/life/modifiers.test.ts`

**Interfaces:**

```ts
// src/life/illness.ts
export const LOW_HEALTH = 30, HIGH_STRESS = 70
export function onsetChance(life: Life, def: IllnessDef): number // band chance × risk multipliers, halved with the vaccine flag, 0 for the wrong gender or if already ill with it; capped at 1
export function catchIllnesses(life: Life, pack: ContentPack, rng: Rng): Life // rolls each IllnessDef once; new ones start at stage 0
export function applySymptoms(life: Life, pack: ContentPack): Life // each known-or-symptomatic illness's stage symptoms, once, as one journal entry
export function discover(life: Life, pack: ContentPack, how: 'check-up' | 'symptoms'): Life // marks hidden ones known, with a journal line
export const knownIllnesses = (life: Life): Illness[]
export function illnessEnergy(life: Life, pack: ContentPack): number // total energy cut from untreated or eased symptoms
```

Rules:
- **The year order.** When a year opens, after the existing yearly changes:
  1. Every illness's `treated` resets to null.
  2. `catchIllnesses` runs.
  3. Stage symptoms apply.
  4. Any illness whose current stage is not `silent` becomes known through `discover(…, 'symptoms')`.
- **Journal lines.**
  - A new non-silent illness: "You came down with dengue fever." (lower-case name, plain).
  - Found by symptoms: "You had been feeling unwell for a while. A doctor said it was high blood pressure."
  - Found at a check-up: "Your check-up found type 2 diabetes. It had been there quietly."
- **What symptoms do.**
  - **Stat changes** apply each year the illness is untreated or only eased.
  - **Energy cuts** lower `energyBudget`, still floored at `MIN_BUDGET`.
  - **Mini-game effects** apply on top of `modifiersFor`'s existing effects, while the illness is known and not cured or controlled.
  - **Silent stages** have no symptoms and no effects.
- **Check-ups.** A Good or better `checkup` result calls `discover(…, 'check-up')`. When nothing is hidden, the existing "Your check-up found nothing new." line stays.
- **Vaccination.** `immunisation` gains `sets: 'vaccinated'`, which halves the onset of illnesses with `vaccine: 'vaccinated'` (diarrhoea and pneumonia in Task 5; others may add more later).

- [ ] **Step 1: Write the failing tests** in `illness.test.ts`, using small fake `IllnessDef`s rather than the real content:
  - `onsetChance` uses the right age band; a male never gets a `gender: 'female'` illness.
  - Low Health and high Stress multiply the chance.
  - The vaccine flag halves it.
  - A silent illness caught at stage 0 is not known and gives no journal line.
  - A check-up reveals it with the check-up line.
  - Moving to a non-silent stage reveals it with the symptoms line.
  - Symptoms apply once a year.
  - `energy.test.ts`: an illness with `energy: 2` lowers the budget by 2, with a floor of 2.
  - `modifiers.test.ts`: a known untreated illness's mods apply, and a controlled one's do not.
- [ ] **Step 2: Run them and see them fail.** `npx vitest run src/life` → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run all tests.** `npm test` → PASS. `npm run check` → clean.
- [ ] **Step 5: Commit.** `git commit -m "Let illnesses start, show their symptoms, and be found by check-ups"`

---

### Task 3: How an illness ends, and dying of one

**Files:**
- Modify: `src/life/illness.ts` (`closeIllnessYear`, `illnessDeath`), `src/life/death.ts`, `src/life/year.ts` (`closeYear`, `ageUp`), `src/life/summary.ts` (only if the cause needs no change, leave it)
- Test: `src/life/illness.test.ts`, `src/life/death.test.ts`, `src/life/year.test.ts`

**Interfaces:**

```ts
// src/life/illness.ts
export function closeIllnessYear(life: Life, pack: ContentPack, rng: Rng): Life // resolves short illnesses and moves long ones on
export function illnessDeath(life: Life, pack: ContentPack, rng: Rng): string | null // the condition's name, or null
// src/life/death.ts
export function deathCause(life: Life, rng: Rng, pack?: ContentPack): string | null // Health 0 → illness → old age → accident
```

Rules (spec 5.11 and 5.12):
- **A short illness** (one stage) resolves at Age Up:
  - **Cured:** it is already gone. Treatment removed it the moment it happened.
  - **Untreated or only eased:** death is rolled at `untreated.die` for your age. Otherwise, with chance `weaker`, you recover but lose `weakerEffects` ("You got over typhoid, but it took a lot out of you."). Otherwise you recover plainly ("You got over the flu.").
  - **In every case** the illness is then removed.
- **A long illness:**
  - **Untreated or eased this year:** roll its stage's `death`. If you survive, roll its `recover` (for example tuberculosis can clear by itself), else move to the next stage (staying on the last).
  - **Controlled this year:** roll only `treated.die`, and stay at the same stage.
  - **Cured:** it is gone.
- **Order at Age Up:** `closeYear` resolves short illnesses and records which illness, if any, killed you. The death check then runs in the spec's order:
  1. Health at 0.
  2. Each untreated illness's chance.
  3. Old age.
  4. An accident.

  Short-illness deaths are decided in this same step, so there is one roll per illness per year.
- **Naming.** The death line and `death.cause` use the illness's `name`, for example "You died at 41. Tuberculosis."
- **Raised risk.** An untreated illness can raise another's onset through `risk.untreated`. For example, untreated high blood pressure doubles the chance of a heart attack and of a stroke. Controlled, it does not.
- **Other people** still die by the existing odds. Their illnesses are out of scope.

- [ ] **Step 1: Write the failing tests** with fake `IllnessDef`s:
  - An untreated short illness with `die: 1` kills, and the cause is its name.
  - With `die: 0` and `weaker: 1`, you recover weaker with its effects and its line.
  - A cured short illness is gone and cannot kill.
  - A long illness untreated moves from stage 0 to 1. Controlled, it stays and rolls only `treated.die`. `recover: 1` clears it.
  - `deathCause` order: Health 0 beats illness, and illness beats old age.
  - `year.test.ts`: a life that dies of illness keeps its age and the named cause, and the summary shows that cause.
- [ ] **Step 2: Run them and see them fail.**
- [ ] **Step 3: Implement.** Keep the rng threading: one generator per `ageUp`, with the state written back.
- [ ] **Step 4: Run all tests.** `npm test` → PASS.
- [ ] **Step 5: Commit.** `git commit -m "Resolve illnesses at Age Up and name them as a cause of death"`

---

### Task 4: Treatment

**Files:**
- Create: `src/life/treatment.ts`
- Modify: `src/life/activities.ts` (Health offers include treatments), `src/app/store.ts` (`begin` handles treatment ids), `src/life/money.ts` (export the BPJS flag check if needed)
- Test: `src/life/treatment.test.ts`, `src/app/store.test.ts`

**Interfaces:**

```ts
// src/life/treatment.ts
export const FAMILY_PAYS_UNDER = 18
export function treatmentCost(life: Life, t: TreatmentDef): number // 0 under 18; 0 with the 'bpjs' flag (JKN covers it); else t.cost
export function treatmentOffers(life: Life, pack: ContentPack): ActivityOffer[] // one per treatment of each known, not-cured illness
export function treat(life: Life, illnessId: string, treatmentId: string, pack: ContentPack): { life: Life; entry: JournalEntry }
```

Rules:
- **Where treatments show.** Treatments appear in the Health category, above the ordinary activities, as generated `ActivityDef`s (id `treat:<illnessId>:<treatmentId>`, like `timeActivity` in Plan 3).
- **Cost and energy.** A treatment has no mini-game and finishes at once. It costs its energy (with the usual overwork) and `treatmentCost`.
- **What each card says.**
  - **Detail:** "Your family pays." under 18, "BPJS covers it." with BPJS, else the price.
  - **Blocked** (only by money, from 18 without BPJS) with "You need Rp 15.000.000. You have Rp 2.000.000." The card also suggests what would open it: "BPJS would cover it."
- **What treatment does,** the moment it is used:
  - `cure` removes the illness: "You had your appendix out. The hospital food was the worst part."
  - `control` sets `treated: 'controlled'` for this year: "You took your blood pressure medicine all year." The card says "Controlled this year. Take it again next year."
  - `ease` sets `treated: 'eased'`. Symptoms and mini-game effects stop for the rest of the year, but the illness still resolves as untreated.
- **Repeats.** A treatment already used this year shows as done, not as a second offer. Cured illnesses show no cards.
- **The store.** `begin('treat:…')` routes to `treat`, saves, and shows the usual Result card.

- [ ] **Step 1: Write the failing tests.**
  - A 9-year-old's treatment costs 0 and says "Your family pays."
  - A 30-year-old with BPJS pays 0 ("BPJS covers it.").
  - Without BPJS and without the money, it is blocked with the exact reason.
  - Cure removes the illness, control marks it for this year, and ease stops symptoms but not resolution.
  - A hidden illness offers no treatment.
  - A treatment done this year is not offered again.
  - `store.test.ts`: `begin('treat:x:y')` treats and saves.
- [ ] **Step 2: Run them and see them fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run all tests.** `npm test` → PASS.
- [ ] **Step 5: Commit.** `git commit -m "Offer treatments in the Health category, paid by family, BPJS or you"`

---

### Task 5: The fourteen conditions

**Files:**
- Create: `src/content/countries/indonesia/illnesses.ts`
- Modify: `src/content/countries/indonesia/index.ts`, `src/content/content.test.ts`, the spec's 5.11 status column and Sources list
- Test: `src/content/content.test.ts`, `src/life/illness.test.ts` (one real-content case per kind)

The real figures, with sources checked on 22 November 2026, are below. Onset chances are game figures sized to Indonesia and tuned in Task 7. Each gets a comment saying so.

| id | Kind | Onset (yearly) | Untreated | Treated | Treatments (from 18 without BPJS) | Sources |
|---|---|---|---|---|---|---|
| `flu` | short | all ages 0.15 | die 0.0005 under 65, 0.005 from 65; weaker 0.05 | die 0 | Rest and fluids (home, Rp 0, 1 energy, ease); See a doctor (puskesmas, Rp 150.000, cure) | WHO influenza (seasonal) fact sheet: about 1 billion cases and 290 000–650 000 respiratory deaths a year, mostly people over 65. https://www.who.int/news-room/fact-sheets/detail/influenza-(seasonal) |
| `diarrhoea` | short | under 5 0.3, else 0.08; `vaccine` | die 0.01 under 5, 0.001 else | die 0 | Oral rehydration (home, Rp 10.000, cure) | WHO diarrhoeal disease fact sheet: about 443 832 under-5 deaths a year; ORS and zinc. https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease |
| `dengue` | short | all ages 0.01 | die 0.02; weaker 0.2 | die 0.001 | Hospital care (hospital, Rp 5.000.000, cure) | Spec sources [1] and [2]: severe dengue above 20% fatal without care, below 1% with it |
| `typhoid` | short | 5–30 0.005, else 0.001 | die 0.15; weaker 0.3 | die 0.005 | Antibiotics (puskesmas, Rp 300.000, cure) | Spec source [3], CDC Yellow Book: 10–30% untreated, below 1% treated |
| `pneumonia` | short | under 5 0.02, 65+ 0.02, else 0.003; `vaccine` | die 0.12 under 30, 0.3 from 30 | die 0.05 | Antibiotics (puskesmas, Rp 300.000, cure); Hospital (Rp 8.000.000, cure) | Pre-antibiotic case fatality about 30–40% (JCI historical review https://www.jci.org/articles/view/29920); pooled pre-antibiotic series about 12% under 30 and 32% at 30–59, about 5% with penicillin (https://pmc.ncbi.nlm.nih.gov/articles/PMC2827629/) |
| `appendicitis` | short | 10–30 0.002, else 0.0005 | die 0.5 (game figure: no direct untreated series; perforation makes death about six times likelier even with surgery) | die 0.003 | Surgery (hospital, Rp 15.000.000, cure) | 9 652 cases: 0.12% died non-perforated, 1.18% perforated (https://pmc.ncbi.nlm.nih.gov/articles/PMC1421275/); the untreated figure is marked as a game estimate |
| `tb` | long | 15–55 0.003, else 0.001 | stages: 0 death 0.18 recover 0.08, symptoms Health −5, energy −1 (stays at stage 0) | die 0.01 | Six-month TB treatment (puskesmas, Rp 0, cure: free under the national programme) | Spec source [4], Tiemersma 2011: about 70% of smear-positive cases die within 10 years, about 3 years to cure or death. The two yearly rates give about 66% dead by year 10. |
| `asthma` | long | 3–15 0.004, else 0.0005 | stage 0 death 0.002, symptoms Stress +3, energy −1 | die 0.0002 | Inhaler (puskesmas, Rp 200.000 a year, control) | WHO asthma fact sheet: 262 million people and 455 000 deaths in 2019. https://www.who.int/news-room/fact-sheets/detail/asthma |
| `high-bp` | long | 35+ 0.02; `risk.untreated` doubles heart attack and stroke | stage 0 silent, death 0.003 (game figure) | die 0.001 | Daily medicine (puskesmas, Rp 600.000 a year, control) | Franco et al. 2005, Hypertension: at 50, normotensives live 5.1 years (men) and 4.9 (women) longer than hypertensives. https://pubmed.ncbi.nlm.nih.gov/15983235/ (the implementer confirms the PubMed id) |
| `diabetes` | long | 35+ 0.008, ×2 with low Health; doubles heart attack | stage 0 silent, death 0.005; stage 1 symptoms Health −3, energy −1, death 0.015 | die 0.004 | Medicine and diet (puskesmas, Rp 1.200.000 a year, control) | Spec source [5], Emerging Risk Factors Collaboration 2023: diagnosis at 50 costs about 6 years, at 40 about 10. The implementer adds the paper's own link. |
| `heart-attack` | short | 45+ 0.003 | die 0.3; weaker 0.5 (Health −10) | die 0.08 | Hospital (hospital, Rp 50.000.000, cure) | Early hospital mortality fell from about 30% to 15% with coronary care units (ACC, https://www.acc.org/Latest-in-Cardiology/Articles/2021/07/01/01/42/Editors-Corner-The-King-of-Hollywood-and-60-Years-of-the-Coronary-Care-Unit) |
| `stroke` | short | 50+ 0.003 | die 0.25; weaker 0.5 (Health −8, Smarts −5) | die 0.15 | Hospital (hospital, Rp 30.000.000, cure) | 30-day in-hospital case fatality 27% in sub-Saharan Africa (Ackah et al. 2024, https://pmc.ncbi.nlm.nih.gov/articles/PMC10798456/) |
| `lung-cancer` | long | 50+ 0.0008 | stage 0 silent death 0.2; stage 1 death 0.7 (symptoms Health −10, energy −2); stage 2 death 0.9 | caught at stage 0: cure; later: control, die 0.3 | Surgery when caught early (hospital, Rp 150.000.000, cure; offered at stage 0 only, otherwise "Found too late for surgery."); Treatment to slow it (hospital, Rp 60.000.000 a year, control) | Wao et al. 2013: pooled untreated survival about 7 months (https://pmc.ncbi.nlm.nih.gov/articles/PMC3579762/) |
| `breast-cancer` | long, women | 35+ 0.001 | stage 0 silent death 0.1; stage 1+ death 0.27 (symptoms Health −5) | caught at stage 0: cure; later: control, die 0.08 | Surgery when caught early (hospital, Rp 80.000.000, cure; stage 0 only); Ongoing treatment (hospital, Rp 40.000.000 a year, control) | Spec source [6], Bloom 1962: median 2.7 years, 18% alive at 5 years, 4% at 10. A yearly 0.27 gives 21% at 5 and 4% at 10. |

Content rules:
- Every symptom text is short and plain, for example "A cough that will not quit, and you are tired all the time." Mini-game effects are named, for example "Dengue fever: your aim wobbles" `{ wobble: 1 }`, "Flu: everything feels slow" `{ move: 0.85 }`, "Asthma: you run out of breath" `{ drain: 1.3 }`.
- Only stage-0-only treatments carry a stage gate. Add a `stages?: number[]` field to `TreatmentDef` for this, blocked with "Found too late for surgery."
- **Spec updates:**
  - 5.11's Status column becomes "Checked" for every row, with the source.
  - The new sources are added to "Sources for section 5.11", continuing the numbering.
  - The appendicitis untreated figure is noted as a game estimate.

- [ ] **Step 1: Write the failing tests.**
  - `content.test.ts`: 14 illnesses; every id in the table exists. Every `risk.untreated` key names an existing illness. Breast cancer is `gender: 'female'`. Every treatment has a place and a non-negative cost.
  - `illness.test.ts`, with the real pack: tuberculosis's two yearly rates give 60–75% dead within 10 years. Breast cancer's rate gives 15–25% alive at 5 years.
- [ ] **Step 2: Run them and see them fail.**
- [ ] **Step 3: Write the content.** Open each new link and confirm the figure before writing it. A source that disagrees with the table by more than about 30% wins, and the change is reported.
- [ ] **Step 4: Run all tests.** `npm test`, `npm run check` → PASS. The 1,000-life simulation's lifespan check may now fail low or high. Task 7 retunes it, so if it fails here, only that test may stay failing, and the report must say so.
- [ ] **Step 5: Commit.** `git commit -m "Add fourteen real conditions with their sources"`

---

### Task 6: Showing illness on screen

**Files:**
- Modify: `src/screens/year/Rail.tsx`, `src/screens/year/ActivitySheet.tsx` (treatment cards first in Health), `src/minigames/Host.tsx` (the named effect line), `src/screens/Title.tsx` (the medical note), `src/screens/SettingsDialog.tsx` (illness sources list), `src/styles/base.css` and the skin token files
- Test: `src/screens/year/Rail.test.tsx`, `src/screens/year/YearScreen.test.tsx`, `src/minigames/Host.test.tsx`, `src/screens/Title.test.tsx`

Rules:
- **The rail.** It shows one badge per known illness under the name: the illness name, plus "controlled" or "eased" when treated this year. With any known untreated illness, the character picture gets a soft tint from a new skin token (`--ill-tint`) in both skins. Reduce-motion changes nothing here. There is no new art (spec 9.2).
- **The Health sheet.** It opens with a "Your health" block: each known illness with its symptoms text, then its treatment cards with the costs and reasons from Task 4. Nothing hidden is mentioned.
- **The mini-game host** shows the named effect line under the instruction while it applies ("Dengue fever: your aim wobbles").
- **The title screen** shows the same note Settings already has: "This is a game. Its health figures are simplified from the sources it lists, and it is not medical advice." It is small, quiet text.
- **Settings** gains a collapsed "Health sources" list: each condition's name and its source links (opening in a new tab with `rel="noreferrer"`).

- [ ] **Step 1: Write the failing tests.**
  - The rail shows "Dengue fever" for a known illness and nothing for a hidden one.
  - The Health sheet lists the treatment with "Your family pays." for a child.
  - The host shows the effect line.
  - The title shows the note.
  - Settings lists at least one source link per condition.
- [ ] **Step 2: Run them and see them fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run all tests and the build.** `npm test`, `npm run check` and `npm run build` → pass. The lifespan check may still be failing from Task 5.
- [ ] **Step 5: Commit.** `git commit -m "Show illnesses on the rail, in the Health sheet and in mini-games"`

---

### Task 7: Balance to Indonesia's lifespan, and the docs

**Files:**
- Modify: `src/dev/simulate.ts`, `src/dev/simulate.test.ts`, `src/content/countries/indonesia/illnesses.ts` (onset tuning only), `README.md`, `AGENTS.md`, the spec (sections 4, 5.11 and 14)

- **What the simulator plays.**
  - It treats each known illness with chance 0.6 when the treatment is open.
  - It takes a check-up with chance 0.3 a year from 35.
  - It joins BPJS with chance 0.5 once, from 18.
- **New checks**, replacing the 65–86 range:
  - Median age at death between **70 and 78** (Dave).
  - Illness causes together between 20% and 70% of deaths.
  - Accidents below 5%.
  - "Health gave out" below 30%.
  - Every condition is caught at least once across the 1,000 lives, so none is unreachable.
  - The per-life "always something to do" invariant stays.
- **Tuning.** Tune only the onset chances, never the death or recovery figures, which are sourced. Keep each onset within a factor of two of the table. If the range cannot be met that way, stop and report BLOCKED with the numbers.
- **Docs:**
  - README's roadmap marks Plan 6 done.
  - AGENTS.md says how to add a condition, with the source rule and the onset-only tuning rule.
  - Spec section 4 gains Dave's three decisions.
  - Spec section 14 gains the calls this plan made: the illness model fields, BPJS covering treatment in full, the treatment prices as game figures, the vaccine halving, symptoms resetting each year, the order inside the death check, and any tuned onset figures.

- [ ] **Step 1: Write the new checks** in `simulate.test.ts`.
- [ ] **Step 2: Run them.** `npx vitest run src/dev` → FAIL until the simulator and tuning are done.
- [ ] **Step 3: Implement and tune,** then run `npm run simulate` (10,000 lives) and report:
  - the median age at death,
  - the share of each cause,
  - the share of lives with a job at 30,
  - the median money at 40.
- [ ] **Step 4: Run everything.** `npm test`, `npm run check` and `npm run build` → all pass.
- [ ] **Step 5: Commit.** `git commit -m "Balance lifespans to Indonesia's with illness, and record Plan 6's calls"`

---

## Left out on purpose

- Illness in other people. Family members still die by the old-age and accident odds.
- Depression, HIV, and conditions tied to sex or drugs (spec 5.11).
- The broad disease catalogue. The fourteen starter conditions come first; the catalogue comes later in content packs.
- Unique mini-games for treatments.
- Smoking and alcohol as risk factors.
- Hospital stays that take up a year.
