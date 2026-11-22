# Life-sim

A life simulator that runs in the browser. You live one life, a year at a time. Each year you spend energy on activities, every activity is a short skill mini-game, and how well you play decides the result.

It is in the same genre as BitLife, but has its own name, look and writing. Nothing is copied from BitLife.

## Three promises

1. **You play your life.** Activities are mini-games, and how well you play decides the result.
2. **You are not boxed in.** Choices are built from a "what" and a "how", more options open up because of who you have become, every limit states its reason, and there is no single correct path through life.
3. **You feel what you do.** Your stats change how the mini-games play, your character and surroundings change, old choices come back years later, and every result lands with motion and sound.

## What is playable today (Plans 1 to 4)

- A whole life: roll a new life at birth, grow through eight stages, and die. A life summary follows, and past lives are kept.
- 44 late-teen activities in eight categories.
- Six mini-game types, and every activity plays one:
  - Timing: stop the marker in the green (Futsal practice).
  - Tapping: tap to hold the meter in the band (Run for OSIS).
  - Memory: repeat the order the pads light up (Chess club).
  - Quiz: answer five questions against the clock (Study for the exam).
  - Catch: move to catch the good and dodge the bad (Eat better this year).
  - Typing: type the words shown (Learn to code). It needs a physical keyboard for now.
- Energy, overwork, rest and repeats.
- Ageing up, with the KTP milestone at 17.
- Events when you age up. Pick what to do and how (calmly, bluntly, with a joke); the how and your luck shape the result.
- Memories. Big moments leave a dot on the lifeline, open extra options to you later, and are quoted back in later events.
- Your family and friends, each with a closeness. Spend time, talk, give a gift, or ask a crush out.
- The romance question, asked once and changeable in Settings.
- Two art styles, switchable at any time.
- Settings: sound, reduce motion, relaxed mini-games.
- Keys 1-8 and Esc.
- Automatic saving on the device.
- Export your saves to a file and import them again.

## Roadmap

Milestone 1 is built as eight plans:

1. Foundation and the playable year.
2. Five more mini-games: Tapping, Memory, Quiz with a starter question bank, Catch, Typing.
3. Events, memories and people.
4. A whole life: eight stages, the new-life roll, death, the life summary, past lives, export and import (done: Plans 1 to 4 are what exists now).
5. School, work, money and family (marriage, children).
6. Health and disease.
7. Content and art for every stage, including the staged 60 images.
8. Checks and publishing: browser checks, accessibility, a code tour, Vercel.

## Long-term goals

- Every activity gets its own unique mini-game. Milestone 1 uses six reusable types as a first step.
- A broad catalogue of real conditions, each with cited sources. Milestone 1 ships about 14.

## Run it

Needs Node 22.12 or newer.

```bash
npm install
npm run dev
```

## Check it

```bash
npm run check   # type check and lint
npm test        # unit and component tests (Vitest)
npm run build   # type check and production build
```

## The two skins

The same screen has two looks: a flat one and a pixel-art one. You can switch at any time. Colours live only in the skin files in `src/styles/` (`flat.css`, `pixel.css`). Pixel art is shown at exactly twice its logical size.

## How art is made

The art is AI-generated, then converted to WebP by Python scripts in `tools/art/`. See [tools/art/README.md](tools/art/README.md).

## Where saves live

- Saves: the browser's IndexedDB, database `life-sim`.
- Settings: localStorage, key `life-sim-settings`.

Use Export and Import on the title screen to back up or move saves (a file called `life-sim-saves.json`). Nothing leaves your device. A damaged or newer save is kept aside and a fresh game starts.

## More

The design is in `docs/superpowers/specs/2026-11-16-life-sim-design.md` and the build plans are in `docs/superpowers/plans/`.
