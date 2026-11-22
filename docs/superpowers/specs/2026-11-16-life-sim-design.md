# Life-sim (working title): design

Status: draft for Dave's approval, 16 November 2026.
Repo: `C:/Users/DAVE TRISTIAN/Projects/life-sim`, to be pushed to GitHub as public `Dave03062006/life-sim`.
Visual reference: `design/mockup-v2/year-screen-v2.html` (approved 16 November 2026).

Every decision below is marked by who made it. **Dave** means Dave chose it in conversation. **Call** means Claude chose it and Dave has not yet confirmed it; all calls are listed again in section 14.

---

## 1. What this is, and why

A life simulator that runs in the browser. You live one life, a year at a time, from birth to death. Each year you spend energy on activities, every activity is a short skill mini-game, and when you age up, life answers back with events.

It is in the same genre as BitLife, which Dave likes. It has its own name, look and writing; nothing is copied from BitLife.

Dave wants it because that genre is fun but has two weaknesses for him: there is nothing to actually play, and it boxes the player in. It is a personal project that also has to work as a portfolio piece.

The game makes three promises. Every feature should serve at least one.

1. **You play your life.** Activities are mini-games, and how well you play decides the result.
2. **You are not boxed in.** Choices are built from a "what" and a "how", more options open up because of who you have become, every limit states its reason, and there is no single correct path through life.
3. **You feel what you do.** Your stats change how the mini-games play, your character and surroundings change, old choices come back years later, and every result lands with motion and sound.

## 2. Goals, non-goals, anti-goals

### Goals for milestone 1

- A whole life is playable from birth to death, in both art styles, with thin content at every age.
- Desktop first. Narrower windows get a working layout; phones get a rough one.
- One country, Indonesia, written in English. A country picker exists and is ready for more.
- Saves on the device, with export and import.
- The repo documents itself: README, `AGENTS.md`, `CLAUDE.md`.

### Not in milestone 1

- More countries, more languages.
- A unique mini-game for every activity. Milestone 1 uses six reusable types. **Unique mini-games per activity are the stated long-term goal and must be written into the README and `AGENTS.md` (Dave).**
- A broad disease catalogue. Milestone 1 ships about 14 conditions. **A broad catalogue is the stated long-term goal and must be written into the README and `AGENTS.md` (Dave).**
- Music, accounts, cloud saves, leaderboards, a phone-first layout.
- Dark-humour content. A toggle for it comes later and is not shown in milestone 1.

### Anti-goals: these make the game a failure even if it works

- **Constricting.** Canned two-option choices; locks and once-a-year caps with no reason; one fixed school-job-retire path.
- **Dice instead of play.** A result that ignores what the player did. Luck is welcome (Dave did not object to luck), but it must not be the whole answer.
- **Silent results.** A stat changing with nothing seen, heard or felt.
- **A wall with no reason.** Anything unavailable must say why and what would open it.
- **A BitLife copy.** No names, text, art, sounds or layout taken from it.
- **Medical advice.** Disease content is based on real sources, and the game says plainly that it is a game and not advice.

## 3. Approaches considered

### 3.1 How content is built

| Approach | Trade-off |
|---|---|
| **Hybrid (picked by Dave):** activities, events, careers, diseases and countries are data read by one rules engine; any entry may also name its own code | Content packs are cheap to add, and an activity can later get its own unique mini-game without changing the engine |
| All data | Fastest to write, but unique mini-games and unusual events have nowhere to live |
| All custom code | Most flexible, but every event is hand-built and a wide catalogue becomes slow to write and test |

### 3.2 How choices avoid feeling canned

| Approach | Trade-off |
|---|---|
| **What plus how (picked by Dave):** pick an action and a manner; extra actions appear because of your stats, job, relationships and past choices | Runs as a plain static site; a few lines of content yield many distinct outcomes |
| AI free text | Least canned, but needs a paid API and a server, cannot run as a static site, and is hard to keep within the tone |
| Play the response as a mini-game | Adds feel but not choice; may be layered on later |

### 3.3 Screen arrangement

| Approach | Trade-off |
|---|---|
| **BitLife's structure with a desktop rail (picked by Dave):** journal in the centre, a big age button in the dock between category buttons, character and stats in a left rail | Familiar to genre players, keeps stats visible while acting |
| BitLife's exact phone arrangement, widened | Most familiar, wastes a wide screen |
| Three columns with activities always open | Fewest clicks, busiest screen, least like the genre; Dave said the first mockup "feels weird" for this reason |

### 3.4 Where art comes from

| Approach | Trade-off |
|---|---|
| Drawn by code and baked to WebP (Dave's first choice, as in Golden Thread) | No outside cost, fully consistent, but the first mockup's code-drawn art was the weakest part of it |
| **AI-generated through Figma, converted to WebP (picked by Dave after seeing both)** | Much richer scenes quickly; costs Figma AI credits; a character who changes over a life needs many consistent images |

For the full game Dave picked a **staged plan of about 60 images for milestone 1** (section 9). Rejected alternatives: a minimum set of about 30 (no scene art in mini-games), a rich set of about 130 (wealth and condition variants; likely beyond a free plan), and AI rooms with a code-drawn character on top (visible body changes, but a simpler-looking character).

## 4. Decisions Dave has made

- Separate public repo under his own account; working title for now; commits and pushes under his name with no AI co-author line.
- Same stack as his Golden Thread game, copying the pieces that fit (section 10).
- Desktop first.
- Each year has an energy budget; it is a soft limit; Age Up is always available.
- Activities are skill mini-games that can be failed, with a penalty. Skipping gives a below-average result.
- Events are mostly choices.
- A life runs from birth to death. Death shows a summary, then a new life. A new life is a random roll that can be re-rolled.
- Main stats: Health, Happiness, Smarts, Looks, Money. Secondary stats: Stress, Reputation.
- People: family, friends, romance and children.
- School path, a job ladder, and a wide career catalogue over time.
- Real diseases that appear at random, with real symptoms and real survival data when untreated.
- Tone: clean, funny and grounded.
- Two art styles, Pixel and Flat illustrated, switchable at any moment. Assets are WebP.
- Sound effects generated in code, plus animation, impact frames and zoom.
- Eight activity categories on one level. Rest gives energy back, less each time.
- No time pressure on the player.
- Build the whole loop first with thin content, then add content packs.
- Marriage is open to every couple. This is a game rule (Plan 5).
- Children come once you are married, or after three years with a partner. Adoption comes later (Plan 5).
- Living costs start with your first full-time job, or at 25 (Plan 5).

Proposed by Claude earlier and not objected to: energy varies by life stage and shrinks with poor Health or high Stress; one to three events when you age up; death from old age, Health reaching zero, illness, or a rare accident; one active life plus a list of past lives; a reduce-motion setting.

## 5. The rules of the game

### 5.1 A life in stages

**Call.** Eight stages. The same eight are used for rules and for art.

| Stage | Ages | School or work | Energy a year | Categories open |
|---|---|---|---|---|
| Baby | 0–2 | none | 3 | People, Fun, Health, Rest |
| Small child | 3–5 | TK from 4 | 5 | adds Mind |
| Child | 6–11 | SD | 7 | adds School, Body, Money: all eight |
| Early teen | 12–14 | SMP | 9 | all eight |
| Late teen | 15–17 | SMA or SMK, or work | 10 | all eight |
| Young adult | 18–34 | university, work, or both | 12 | all eight |
| Adult | 35–59 | work | 12 | all eight |
| Senior | 60+ | retirement is optional | 8 | all eight |

The first category is labelled **School** while you are enrolled and **Work** otherwise. It lists school activities if you are enrolled and work activities if you are 15 or older.

Even a baby plays: learning to crawl, first words, crying for attention. Early years are short because energy is small.

### 5.2 A year

1. **The year opens.** Your age goes up. Yearly changes apply (5.4). Illnesses may start (5.11). One to three events arrive (5.7). Energy refills.
2. **You act.** Open a category, pick an activity, play its mini-game. Repeat as often as you like.
3. **You age up** whenever you choose. Unspent energy is lost. Untreated illnesses are resolved. Salary, allowance and living costs are settled. Death is checked (5.12).

### 5.3 Stats

All stats run from 0 to 100, except Money, which is a whole number of Rupiah and may go negative (debt).

| Stat | Meaning | What it does elsewhere |
|---|---|---|
| Health | Body | Energy budget, movement in mini-games, risk of illness and death |
| Happiness | Mood | Success of light-hearted approaches in events; relationships |
| Smarts | Mind | Grades, quiz time, memory preview, which jobs open |
| Looks | Appearance | Romance and some jobs |
| Money | Rupiah | Pays for activities, treatment, school, things |
| Stress (secondary) | Strain | Shakes timing in mini-games, cuts energy, wears down Health |
| Reputation (secondary) | How others see you | Opens clubs, jobs, promotions and event options |

**Call.** Starting values are rolled at birth: Health 60–100, Happiness 50–90, Smarts 20–90, Looks 20–90, Stress 0–20, Reputation 50.

### 5.4 Yearly changes

**Call.** Applied when a year opens, before events.

- Stress falls by 10 (by 5 if you hold a full-time job).
- Happiness and Reputation move 10% of the way back towards 50.
- From 45, Health falls by 1 a year; from 65, by 2. From 40, Looks falls by 1 a year.
- Closeness with each person falls by 3 unless you spent time with them that year.
- Money: allowance or salary comes in, living costs go out (5.10).

### 5.5 Energy, overwork, rest and repeats

- **Budget.** The stage sets it (5.1). **Call:** Health below 30 takes 2 away, Stress of 70 or more takes 2 away, a full-time job reserves 4 and a part-time job reserves 2. The budget is never below 2.
- **Soft limit (Dave).** You may act with no energy left. **Call:** each point spent below zero adds 4 Stress and removes 2 Health, and the journal says you were worn out.
- **Rest (Dave).** Rest activities give energy back. Each rest that year gives one point less than its base, down to nothing. Paid rest has a higher base. Energy never exceeds the budget.
- **Repeats (Call).** An activity may be repeated in the same year. The nth repeat gives its benefits divided by (1 + n). Costs do not shrink.
- **No arbitrary locks (Dave).** The only gates are physical, legal, financial, or a requirement the player can work towards. Each one is shown on the activity with its reason, for example "From age 17, with a SIM C licence" or "You need Rp 250.000. You have Rp 65.000."

### 5.6 Activities and mini-games

An activity has: a category, a title and one-line description, the stages it appears in, requirements with reasons, an energy cost, a money cost or gain, a mini-game type and theme, benefits, a fail penalty, and journal lines for each result.

The mini-game returns a score from 0 to 1, which becomes one of four results.

| Result | Score (Call) | Effect |
|---|---|---|
| Fail | below 0.25 | No benefit, and the activity's penalty applies (Dave) |
| Weak | 0.25–0.5 | Half the benefits. Skipping the mini-game gives this (Dave) |
| Good | 0.5–0.85 | Full benefits |
| Great | 0.85 and above | One and a half times the benefits |

**The six mini-game types for milestone 1 (Dave: six reusable types; details are calls).** Each lasts 20 seconds or less, opens with one line of instruction, can be played with the keyboard or the pointer, and can be skipped.

| Type | What you do | Score |
|---|---|---|
| Timing | A marker sweeps a bar; stop it in the zone. One to three rounds | Best in the gold centre, less in the green, a little for a near miss |
| Tapping | Keep a draining meter inside a band by tapping in rhythm | Share of time inside the band |
| Memory | Watch a sequence or a set of positions, then repeat it | Share correct, with a streak bonus |
| Quiz | Five multiple-choice questions against a clock, from a bank tagged by subject and level | Share correct, with a small time bonus |
| Catch | Move left and right to catch good things and dodge bad ones | Good caught minus bad hit |
| Typing | Type the words shown before time runs out | Accuracy times completion |

**Your state changes how they play (Dave: stats change mini-games; the mapping is a call).**

- Stress of 60 or more adds jitter to moving markers and shortens time limits.
- Health below 40 slows your movement and makes meters drain faster.
- Smarts lengthens quiz time and memory previews, and at 80 or more removes one wrong quiz answer.
- Acting with no energy left narrows every target by 10%.
- Illnesses add their own effect, named on screen, for example "Dengue fever: your aim wobbles".
- Small children get wider targets; seniors get slower movement.

**Results must land (Dave).** A success triggers an impact frame, a quick zoom that settles back, a shake, a big word on screen and a sound. A failure shakes and sounds low. Stat bars in the rail move at once and show the change as a number. With reduce-motion on, the flash, zoom and shake are skipped and the numbers still show.

A mini-game pauses when the window loses focus.

**Relaxed mini-games (Call).** A setting that widens targets and slows everything, taken from Golden Thread's "gentle" mode, so nobody is stuck.

### 5.7 Events

When a year opens, the game draws one to three events that fit your age, stats, relationships, job and memories. At most one is a big event, meaning one that changes your situation: a death, a move, a lost job, a serious illness. Milestones (starting school, turning 17 and getting a KTP) are journal lines, not dialogs.

A **news event** has no choice: something happens, the journal says so, and its effects apply.

A **choice event** shows a short situation, then two rows:

- **What do you do?** Two to five actions. Some are always there. Others are open only to you and say why: "Open to you: Reputation 60+" or "Open to you: your choice at 13".
- **How?** Two or three manners. The standard set is Calmly, Bluntly and With a joke; an event may supply its own.

**Call: how an event resolves.** Each action has a base chance. The manner shifts it using your stats: Calmly is the safe one and softens any Stress; Bluntly makes the result larger in either direction; With a joke works with high Happiness or Reputation and can backfire. Luck adds or removes up to 20 points. The result is a success, a mixed result or a failure, each with its own text and effects.

**Memories (Dave: choices come back).** An event or activity may record a memory: the age, a line of text, and the people involved. Memories appear as dots on the lifeline at the top of the journal, unlock actions in later events, and are quoted back in the journal ("Dimas has not forgotten that you covered for him").

### 5.8 People

- **Family** is generated at birth: mother, father, up to three siblings, and living grandparents.
- **Friends** come from activities and events. **Call:** at most eight are tracked; the least close drifts away when a ninth arrives.
- **Romance** begins in the teenage years with a crush, then dating, then a partner. Marriage is possible from 19. **Call:** the first time romance comes up, the game asks who you are interested in (women, men, both, or nobody yet); the answer can be changed later.
- **Children** arrive by events and then appear as people who grow up.

Each person has a name, an age, a relation to you and a closeness from 0 to 100. People age and die by the same rules you do.

The People category lists the people in your life with their closeness. Picking one offers things to do with them: spend time (a mini-game that suits the person), talk (a small what-plus-how choice), give a gift, and for a partner, date or propose.

### 5.9 School and work

**Call**, based on the Indonesian system. Facts in content are checked against a source as it is written.

- **School.** SD at 6, SMP at 12, SMA or SMK at 15. Grades each year come from Smarts and from how well you play study activities. You may leave school once SMP is finished; before that the game says why not.
- **After SMA.** University needs a passed entrance test (a longer quiz) and yearly fees, unless you earn a scholarship (Smarts and grades) or your family pays. You choose one of five fields (engineering and computing, health, education, business, arts), which decides the careers open to you. Or you go straight to work. Adults may go back to study at any age.
- **Work.** A job board lists what you qualify for, with the reason for each one you do not. A job pays a yearly salary and reserves energy. Work activities raise your performance; once a year, good performance plus the role's requirements brings a promotion offer as an event. You may quit, change career or start a business at any age. Retirement from 58 is a choice, never forced.

**Careers in milestone 1 (Call).** Eight ladders of three or four steps: shop and warung, office, teaching, nursing, software, driving and delivery, civil service, and running your own business. The wide catalogue (athlete, musician, chef, pilot, politician and more) comes in later packs.

### 5.10 Money

**Call.** Amounts are realistic Rupiah for present-day Indonesia.

- Children get an allowance set by the family's wealth, which is rolled at birth as one of four levels.
- Adults receive a salary and pay living costs. Three lifestyles (frugal, normal, comfortable) trade money against Happiness and Health.
- Savings earn a little interest. Things you buy (a motorbike, a house) have a price, an effect and a resale value.
- Joining BPJS, the national health scheme, cuts the cost of treatment.
- Debt is allowed and raises Stress every year it lasts.

### 5.11 Health and disease

**Dave:** illnesses appear at random in a year; untreated, the player suffers the real symptoms and can die on a timeline taken from real data.

**How it works (Call).**

- When a year opens, each condition you do not have is rolled against its yearly chance for your age, raised or lowered by risk factors such as low Health or long-term Stress.
- While you have it, its symptoms apply at once: stat losses, less energy, and a named effect on mini-games.
- The Health category offers its treatments: a doctor, a hospital, medicine, or a habit. Each has a cost and a real-world effect: it cures, it controls, or it only eases symptoms. Treatment takes effect the moment you do it.
- At Age Up, an untreated illness is resolved. A **short illness** (dengue, typhoid) ends: you recover, are left weaker, or die, at the real untreated rates. A **long illness** (tuberculosis, diabetes, cancer) stays, moves to its next stage, and carries a yearly chance of death set so that survival in game years matches real untreated survival.
- Because one turn is one year, illnesses that really last days are compressed into "this year". Their odds are real; their duration is not.
- Vaccination and check-ups are activities, so prevention is something you do.

**Each condition is data** with these fields: name; short or long; ages and yearly chance; risk factors; symptoms as text, stat effects and a mini-game effect; treatments with cost and effect; untreated outcome (rates, or stages with yearly death chance); treated outcome; and **at least one source with a link**. A test fails the build if a condition has no source.

**Starter list for milestone 1 (Call).** "Checked" means the figure was confirmed against the linked source on 16 November 2026. "To check" means it is from Claude's memory of the named source and must be confirmed, with a link, before it ships.

| Condition | Type | Mostly affects | Untreated, in reality | Treated | Status |
|---|---|---|---|---|---|
| Influenza | short | all ages | Rarely fatal in healthy people; riskier past 65 | Rest and fluids | Checked: WHO [7] |
| Acute diarrhoea | short | under 5 | A leading killer of small children through dehydration | Oral rehydration prevents most deaths | Checked: WHO [8] |
| Dengue fever | short | all ages | Severe dengue can kill more than 20% without care | Below 1% with proper care | Checked [1][2] |
| Typhoid fever | short | 5–30 | 10–30% die | Below 1% with prompt care | Checked [3] |
| Pneumonia | short | under 5, over 65 | About 30% in the years before antibiotics | Far lower with antibiotics | Checked [9][10] |
| Appendicitis | short | 10–30 | Often fatal once it bursts | Under 1% with surgery | Checked [11]; untreated figure is a game estimate |
| Tuberculosis | long | 15–55 | About 70% die within 10 years (smear-positive), about 20% (smear-negative); about 3 years from onset to cure or death | About six months of treatment cures most | Checked [4] |
| Asthma | long | from childhood | Attacks; rarely fatal | Controlled with an inhaler | Checked: WHO [12] |
| High blood pressure | long | 35+ | Shortens life by several years through stroke and heart disease | Controlled with daily medicine | Checked [13] |
| Type 2 diabetes | long | 35+ | Diagnosis at 50 costs about 6 years of life; at 40, about 10 | Controlled with medicine and habits | Checked [5] |
| Heart attack | short, on heart disease | 45+ | A large share die within a month without care | Much lower in hospital | Checked [14] |
| Stroke | short | 50+ | Roughly one in five die within a month | Lower with fast care | Checked [15] |
| Lung cancer | long | 50+ | About 7 months median survival | Better if caught early | Checked [16] |
| Breast cancer | long | women 35+ | Median 2.7 years; 18% alive at 5 years, 4% at 10 | Most survive when caught early | Checked [6] |

Not in milestone 1 (**Call**): HIV and other conditions tied to sex or drugs wait for the dark-humour setting or a later decision; depression waits until it can be written with care.

The game carries a short note on its title and settings screens: it is a game, its figures are simplified from the sources it lists, and it is not medical advice.

### 5.12 Death and the life summary

**Call.** Checked at Age Up, in this order.

1. Health at zero.
2. Each untreated illness's chance of death.
3. Old age: 1% a year from 60, 4% from 70, 12% from 80, 30% from 90. Halved if Health is 80 or more, doubled if it is below 30.
4. A rare accident: 0.05% a year at any age.

These are tuned so a typical careful life ends in the seventies, close to Indonesia's real life expectancy. A simulation test checks this (section 10.6).

Death shows a **life summary**: name and years, cause of death, the lifeline with its memories, final stats and net worth, the people left behind, and one closing line. From there the player starts a new life or opens the list of past lives.

### 5.13 Starting a life

The player picks a country (only Indonesia in milestone 1), then sees a roll: name, gender, city, family and its wealth, and starting stats. They may re-roll without limit and edit the name and gender (**Dave:** random roll, can re-roll). Names and cities come from Indonesian lists.

## 6. Content for milestone 1

**Dave:** thin content first. **Call:** the numbers.

| Stage | Activities offered | Choice events | News events |
|---|---|---|---|
| Baby | 8 | 6 | 6 |
| Small child | 12 | 8 | 6 |
| Child | 24 | 12 | 8 |
| Early teen | 36 | 14 | 8 |
| Late teen | 48 (the set in the mockup) | 14 | 8 |
| Young adult | 48 | 16 | 10 |
| Adult | 44 | 16 | 10 |
| Senior | 30 | 12 | 10 |

Many activities span several stages, so this is about 110 distinct activities and about 100 choice events. Also needed: about 150 quiz questions tagged by subject and school level, the name and city lists, 8 career ladders, and the 14 conditions.

**Tone rules for writers (Dave: clean, funny, grounded; details are calls).** Everyday mischief is in: skipping class, a white lie, cheating on a test, with consequences. Crime, drugs, sex and gore are out until the dark-humour setting exists. Humour comes from recognisable life, not from cruelty. No religion is assigned to the character in milestone 1; holidays are written neutrally.

## 7. Look and feel

The approved mockup is the reference for layout, spacing, colour, type and motion. Where this section and the mockup disagree, the mockup wins.

### 7.1 The year screen

- **Rail (left).** A picture of you in your surroundings, your name and one line about you, the four main stats as bars, money, the two secondary stats, and a card for any illness. Status badges such as "Feverish" or "Overworked" sit on the picture.
- **Journal (centre).** Your age in large type, the lifeline (your life so far by stage, with a dot for each memory), and the entries for each year. It always opens on the current year.
- **Dock (bottom).** The energy meter, four categories, the age button ("Age up: Turn 17"), four more categories.
- **Activity sheet.** Picking a category raises its activities over the lower part of the journal. Each card shows the picture, title, description, energy, mini-game type, money, and how often it has been done this year; or the reason it is unavailable.
- **Mini-game and event dialogs** open over the whole screen.
- **Birthday screen.** A full-screen age number for about a second when you age up.
- **Keys.** 1 to 8 open the categories, Esc closes a sheet, Space or Enter plays the main action in a mini-game.

### 7.2 Window sizes

| Width | Layout |
|---|---|
| 1180 px and wider | Rail beside the journal; dock in one row |
| 940–1179 px | Same, with the age button moved up beside the energy meter |
| Under 940 px | The rail becomes a band across the top: picture on the left, name and stats on the right |
| Under 560 px | Everything stacks and the page scrolls. Rough in milestone 1 |

### 7.3 Two skins, one screen

Both skins use the same components and layout. They differ in colour, type, corners, materials, art and motion. The player can switch at any moment, including during a mini-game, and the switch is instant.

| | Flat illustrated | Pixel |
|---|---|---|
| Idea | Daylight. Frosted panels over a soft blur of your own room | A 16-bit console at night. Solid windows with stepped corners |
| Type | Plus Jakarta Sans | Pixelify Sans |
| Ink and accent | Indigo `#252A5E`, vermilion `#D2432A` | Near-white `#EEF2FF` on navy `#0B1E57`, gold `#FFC533` |
| Stat colours | Coral, yellow, indigo, teal, taken from the art | Brighter versions of the same four |
| Corners | Round, 18–30 px | Square, with two-pixel stepped frames |
| Motion | Springy, 0.2–0.35 s | Stepped, 0.12–0.16 s, with a blinking cursor on hover |
| Art | Smooth illustration | True pixel art, always shown at exactly twice its size |

Colours and sizes live in one token file per skin. Components never hold raw colour values.

### 7.4 Sound

**Dave:** generated in code, no audio files. One small synth with a softer wave for Flat and a square wave for Pixel. Sounds: tap, open, success (two levels), failure, age up. A mute button is always visible.

### 7.5 Accessibility

Every control is a real button reachable by keyboard with a visible focus ring. Text meets a contrast of 4.5 to 1. Reduce-motion (the system setting, or the game's own) removes flashes, zooms and shakes. Colour is never the only signal. Mini-games can be skipped or relaxed.

## 8. Saves and settings

**Call**, following Golden Thread.

- Saves live in the browser's IndexedDB on this device. The game saves after every action.
- One life is active at a time. Finished lives are kept in a list. Starting a new life while one is in progress asks first, then moves the unfinished life to the list as abandoned.
- The title screen can export everything to a file and import it again.
- Each save records its format version, and the loader upgrades old saves step by step.
- Settings: art style, sound, reduce motion, relaxed mini-games.

## 9. Art

### 9.1 How art is made

1. Images are generated with Figma's AI into the Figma file "Life-sim art", one consistent prompt preamble per skin. The prompts are kept in `design/art-prompts.md` so new art matches old.
2. The originals are saved under `design/art-source/`.
3. `tools/art/build.py` converts them: Flat images are resized; Pixel images are snapped to a true pixel grid with a limited palette; icon sheets are cut into uniform tiles and packed into sprites. Everything is written as WebP into `public/art/` with a manifest.
4. The game loads art only through the manifest.

**Pixel sizes (Call).** Character scenes 160×160, icons 32×32, mini-game scenes 360×240, banners 384×256. All are displayed at exactly twice that size so every pixel stays square.

**Call:** the conversion tools stay in Python (Pillow and NumPy), because they exist and work. Converted art is committed, so nobody needs Python unless they regenerate art.

### 9.2 The staged plan for milestone 1 (Dave: about 60 images)

Images are generated in this order. The game must work at every point along the way.

| Order | What | New images |
|---|---|---|
| 1 | Character scenes: six stages for a boy and a girl, plus baby and small child shared, in both skins (the late-teen boy exists) | 26 |
| 2 | Icon sheets: six more sheets of 16 icons, in both skins (four sheets already exist) | 12 |
| 3 | Mini-game scenes: one per category in both skins (the futsal scene exists) | 14 |
| 4 | Milestone pictures: birth, graduation, wedding, farewell, in both skins | 8 |
| | **Total** | **60** |

**Every picture has a fallback (Dave: the game must still work if credits run out).**

- A missing character scene uses the nearest stage of the same gender, then the other gender.
- A missing icon uses its category's icon.
- A missing mini-game scene uses a plain panel in the skin's colours.
- A missing milestone picture means the dialog has no banner.

**Illness, tiredness and fitness are shown with badges and a tint on the picture, not with new drawings (Dave).** Drawn variants and homes that change with wealth are for a later pack.

Generation stops at once if Figma refuses a request, and Dave is told how far it got.

## 10. How it is built

### 10.1 Stack (Dave: same as Golden Thread)

Vite, React 19, TypeScript, Zustand for state, idb-keyval for saves, Vitest for tests, Oxlint, Playwright scripts for browser checks, and Vercel for hosting as a static site.

### 10.2 Pieces copied from Golden Thread and adapted

From `C:/Users/DAVE TRISTIAN/Projects/bible-game/src`:

- `engine/clock.ts`, `engine/input.ts`, `engine/motion.ts`, `engine/random.ts`, `engine/settings.ts`, `engine/save/`: the game clock, input, motion helpers, seeded randomness, settings and saves.
- `minigames/framework.ts`: the contract that a mini-game's rules are plain TypeScript advancing in fixed steps, with a separate view. Its scene-specific parts are dropped.
- `ui/useReducedMotion.ts`, and the patterns in `app/store.ts`, `app/params.ts` and `app/backup.ts`.
- The browser-check scripts under `scripts/` as starting points.

Not copied: scenes, the story director, the cathedral, the map, music.

### 10.3 Folder map

```
src/
  app/        the store, which screen is showing, sound, address options
  engine/     clock, input, motion, randomness, saves, settings
  life/       the rules of a life, as plain TypeScript with no React
  content/    typed data: countries/indonesia/, diseases/, quiz/
  minigames/  framework.ts, then one folder per type: rules.ts and View.tsx
  styles/     the two skins' tokens, the art manifest, sprite helpers
  screens/    Title, NewLife, Year, Summary, PastLives, Settings
  ui/         shared parts: card, bar, chip, sheet, dialog, dock, icon
  dev/        the life simulator used by tests, and a frame meter
tools/art/    the Python conversion scripts
scripts/      browser checks: play-through, accessibility, keyboard, screenshots
public/art/   converted WebP art and its manifest
design/       source art, prompts and mockups; not part of the build
docs/         this design, build plans, a code tour
```

### 10.4 The rules engine

`src/life/` is pure: given a life, an action and a random seed, it returns a new life. It never touches the screen, the clock or storage. That is what lets a test play ten thousand lives in seconds.

Its surface, in plain terms:

- start a new life from a seed and options;
- list the activities open now, each with either its costs or the reason it is closed;
- begin an activity, which returns the mini-game to play and how your state changes it;
- finish an activity with a score, which returns the new life and the journal entry;
- age up, which returns the new life and the events waiting;
- resolve an event with a "what" and a "how";
- end a life and produce its summary.

A life holds: identity, age and stage, stats, money, energy used and rests taken this year, how often each activity was done this year, conditions, people, school and job, belongings, memories, flags, the journal, and the state of its random generator.

All randomness comes from the seeded generator stored in the life, so a save replays identically.

### 10.5 Content as data, with an escape hatch (Dave: hybrid)

Activities, events, careers, conditions, names and quiz questions are typed TypeScript data under `src/content/`. An activity or event may name a custom module instead of a standard type. That is how one activity at a time gets its own unique mini-game later, without touching the engine.

Requirements are data too, and each carries the sentence shown to the player when it is not met.

Everything specific to a country lives under `content/countries/<id>/`, so adding a country means adding a folder. Text is plain English inside the data; there is no translation layer in milestone 1. The game's name lives in one constant, so the working title can be replaced in one edit.

### 10.6 Tests

- **Rules:** unit tests for energy, overwork, rest, repeats, results, events, illness and death.
- **Content:** every activity has an icon, a mini-game, journal lines and a reason on every requirement; every event has at least two actions; every condition has a source; every picture named exists in the manifest or has a fallback.
- **Simulation:** ten thousand random lives finish without an error or a dead end; typical lifespan and causes of death fall in expected ranges; no activity is unreachable.
- **Mini-games:** each type is played by a script with fixed input and gives the expected score.
- **Browser:** play one year in each skin; accessibility checks; a keyboard-only run; screenshots at 680, 1000 and 1440 px wide.

### 10.7 Loading

The first screen loads only its own skin's art. Mini-games and the art for other stages load when first needed.

## 11. Documents the repo carries

- **README.md** for people: what the game is, how to run and check it, how art is made, how to publish, the roadmap. It states both long-term goals: a unique mini-game for every activity, and a broad disease catalogue.
- **AGENTS.md** for AI helpers: the folder map, the commands, how to add an activity, an event, a condition and a mini-game, the tone rules, the anti-goals, and the same two long-term goals. It also says commits are made under Dave's account with no AI co-author line.
- **CLAUDE.md**: one line that pulls in `AGENTS.md`, so there is a single source.
- **docs/**: this design, the build plan, and a short code tour once there is code.

## 12. Milestones

1. **Milestone 1: the whole loop.** Everything in this document, thin content, both skins, saves, documents, ready to publish.
2. **Milestone 2: content packs.** More activities and events at every age, the wide career catalogue, the broad disease catalogue, and the first unique mini-games.
3. **Milestone 3: breadth.** More countries, the dark-humour setting, music, a proper phone layout.

### What needs Dave

- A go-ahead before the public GitHub repo is created and first pushed.
- Connecting the repo in Vercel once, when milestone 1 is ready to publish.
- Enough Figma AI credits for the art, or a decision to stop at whatever point they run out.

## 13. Risks

- **Writing volume.** About 110 activities, 100 events and 150 quiz questions is the largest part of milestone 1. The plan should write content stage by stage so a playable game exists early.
- **AI art credits.** The plan is free and its allowance is unknown. The fallbacks in 9.2 are what make this safe.
- **Art consistency.** Sixteen character scenes must read as the same person growing up. Prompts repeat the same description of the character; a scene that does not match is regenerated, which costs credits.
- **Balance.** Energy, penalties and illness can make a life too easy or too harsh. The simulation test is the guard.
- **Medical accuracy.** Nine of fourteen starter figures are still unconfirmed. They are confirmed, with links, before the condition ships.
- **Pixel sharpness.** On displays scaled to 125% some pixel art cannot be perfectly square. Accepted for milestone 1.

## 14. Calls made by Claude, for Dave to check

1. Eight life stages with these ages and energy budgets (5.1).
2. Babies and small children are playable, with small budgets.
3. Result thresholds and multipliers for mini-games (5.6).
4. Which stat changes which mini-game (5.6).
5. A "relaxed mini-games" setting.
6. How events resolve, and the standard manners Calmly, Bluntly, With a joke (5.7).
7. At most eight tracked friends.
8. The game asks who you are interested in when romance first comes up (5.8).
9. You may leave school after SMP; a full-time job reserves 4 energy; retirement is never forced (5.9).
10. The eight career ladders for milestone 1 (5.9).
11. The money rules, including BPJS and debt (5.10).
12. The illness model, the 14 starter conditions, and leaving out HIV and depression for now (5.11).
13. The odds of dying of old age and by accident (5.12).
14. Content counts for milestone 1 (section 6).
15. The tone boundaries, and no religion for the character in milestone 1 (section 6).
16. Art conversion tools stay in Python (9.1).
17. `CLAUDE.md` points at `AGENTS.md`.
18. No automated checks on GitHub in milestone 1; checks are run locally.
19. Five university fields (5.9).
20. An unfinished life is kept as abandoned when a new one starts (section 8).
21. Text is plain English in the data, with no translation layer yet (10.5).
22. Old age past the 5.12 table: 60% a year from 100, scaled by Health like the rest, and certain death at 115, whatever the Health. The table stopped at 90, and a 149-year-old broke the grounded tone (5.12, Plan 4).
23. The eight ladders and their salaries (Plan 5, careers.ts), as yearly Rupiah: shop work 18.000.000 (part-time) to 84.000.000; office 48.000.000 to 180.000.000; teaching 18.000.000 to 108.000.000; nursing 54.000.000 to 108.000.000; software 60.000.000 to 300.000.000; driving 36.000.000 (part-time) to 72.000.000; civil service 48.000.000 to 144.000.000; your own business 30.000.000 to 240.000.000, paid by a formula on performance, with a 10.000.000 start cost. Entry rows come from checked sources; higher rungs are game steps up.
24. University fees are UNI_FEE, Rp 10.000.000 a year. Funding is a scholarship when Smarts is 80 or more and the last grade is 80 or more, otherwise paid by the family when it is comfortable or well-off, otherwise by the player (Plan 5).
25. The report card is 0.6 x Smarts + 0.4 x 100 x study effort (capped at 3 study activities), rounded. Nobody repeats a year: the level ends when its years are done (Plan 5).
26. Allowance by wealth, a year for ages 6 to 11 and doubled for 12 to 17: struggling Rp 250.000, getting by Rp 600.000, comfortable Rp 1.500.000, well-off Rp 3.000.000. Lifestyle costs a year: frugal Rp 24.000.000 (Happiness -2, Health -1), normal Rp 42.000.000, comfortable Rp 84.000.000 (Happiness +3, Health +1). A child under 18 costs Rp 9.000.000 a year (Plan 5).
27. Interest is 2% a year on positive money for players with a bank account (Plan 5).
28. Debt adds 5 Stress every year it lasts. Debt never stops you applying for a job that costs nothing to start; a first version blocked every job while in debt, and the simulator found it (Plan 5).
29. The belongings: a motorbike at Rp 8.000.000 (resale Rp 5.500.000), a car at Rp 150.000.000 (resale Rp 100.000.000), and a starter house at Rp 185.000.000 that cuts living costs by Rp 15.000.000 a year (Plan 5).
30. Three plan figures changed after checking sources: Junior developer Rp 60.000.000 a year (was 84.000.000), the motorbike Rp 8.000.000 (was 4.500.000), and the house Rp 185.000.000 as a subsidised starter house (was 600.000.000).

The appendicitis untreated figure (0.5) is a game estimate: no series of untreated cases exists.

## 15. Left to the builder

- Exact numbers for every activity's benefits and costs, tuned with the simulation.
- The wording of every activity, event and journal line, within the tone rules.
- The precise scoring curve of each mini-game.
- Component boundaries inside `src/ui/` and `src/screens/`.
- Whether the lower half of an empty journal should show something at the start of a year. Dave has not asked for it.

## Sources for section 5.11

1. World Health Organization, "Dengue and severe dengue" fact sheet, 2012 archive: https://webarchive.library.unt.edu/web/20121010013248/http://www.who.int/mediacentre/factsheets/fs117/en
2. WHO Regional Office for the Eastern Mediterranean, dengue fact sheet, 2014: https://applications.emro.who.int/dsaf/emropub_2014_EN_1629.pdf
3. CDC Yellow Book, "Typhoid and Paratyphoid Fever": https://www.cdc.gov/yellow-book/hcp/travel-associated-infections-diseases/typhoid-and-paratyphoid-fever.html
4. Tiemersma et al., "Natural History of Tuberculosis", PLoS ONE, 2011: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3070694/
5. Emerging Risk Factors Collaboration, life expectancy and age at diagnosis of type 2 diabetes, 2023; summary: https://www.nursinginpractice.com/?p=33584
6. Bloom et al., "The natural history of untreated breast cancer (1805–1933)", 1962: https://pubmed.ncbi.nlm.nih.gov/5220111/
7. WHO, "Influenza (seasonal)" fact sheet: https://www.who.int/news-room/fact-sheets/detail/influenza-(seasonal)
8. WHO, "Diarrhoeal disease" fact sheet: https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease
9. Pre-antibiotic pneumonia mortality, JCI historical review: https://www.jci.org/articles/view/29920
10. Pneumonia case fatality by age before and after penicillin: https://pmc.ncbi.nlm.nih.gov/articles/PMC2827629/
11. Appendicitis mortality in 9 652 cases: https://pmc.ncbi.nlm.nih.gov/articles/PMC1421275/
12. WHO, "Asthma" fact sheet: https://www.who.int/news-room/fact-sheets/detail/asthma
13. Franco et al., Hypertension, 2005: https://pubmed.ncbi.nlm.nih.gov/15983235/
14. ACC, coronary care unit history: https://www.acc.org/Latest-in-Cardiology/Articles/2021/07/01/01/42/Editors-Corner-The-King-of-Hollywood-and-60-Years-of-the-Coronary-Care-Unit
15. Ackah et al., 2024, stroke case fatality in sub-Saharan Africa: https://pmc.ncbi.nlm.nih.gov/articles/PMC10798456/
16. Wao et al., 2013, survival of untreated lung cancer: https://pmc.ncbi.nlm.nih.gov/articles/PMC3579762/
