import { NAMES } from '../content/countries/indonesia/names'
import { createRng } from '../engine/random'
import type { ContentPack } from '../content/types'
import { deathCause } from './death'
import { peopleDeaths, startingPeople, yearlyPeople } from './people'
import { applyChanges, roundAway } from './stats'
import type { Change, Gender, Life, Wealth } from './types'

export interface NewLifeOptions { seed: number; startAge?: number; name?: string; gender?: Gender; city?: string; wealth?: Wealth }

export function newLife({ seed, startAge = 0, name = 'Raka Pratama', gender = 'male', city = 'Surabaya', wealth = 'getting-by' }: NewLifeOptions): Life {
  const rng = createRng(seed)
  const roll = (min: number, max: number) => rng.int(min, max + 1)
  const health = roll(60, 100)
  const happiness = roll(50, 90)
  const smarts = roll(20, 90)
  const looks = roll(20, 90)
  const stress = roll(0, 20)
  const people = startingPeople(rng, startAge, gender, name, NAMES)
  return {
    version: 3,
    id: `life-${seed}`,
    rng: rng.state,
    country: 'indonesia',
    name,
    gender,
    city,
    age: startAge,
    stats: { health, happiness, smarts, looks, stress, reputation: 50 },
    money: startAge >= 15 ? 200000 : 0,
    energySpent: 0,
    restsThisYear: 0,
    doneThisYear: {},
    journal: [],
    people,
    memories: [],
    interest: null,
    pendingEvents: [],
    seenEvents: [],
    spentWith: [],
    wealth,
    death: null,
  }
}

const towardFifty = (value: number): number => roundAway((50 - value) * 0.1)

export function ageUp(life: Life, pack: ContentPack): Life {
  const rng = createRng(life.rng)
  const cause = deathCause(life, rng)
  if (cause) {
    const entry = { age: life.age, kind: 'milestone' as const, text: `You died at ${life.age}. ${cause}.`, changes: [] }
    return { ...life, rng: rng.state, death: { age: life.age, cause }, journal: [...life.journal, entry] }
  }
  const age = life.age + 1
  const { happiness, reputation } = life.stats
  const changes: Change[] = [
    { key: 'stress', delta: -10 },
    { key: 'happiness', delta: towardFifty(happiness) },
    { key: 'reputation', delta: towardFifty(reputation) },
    { key: 'health', delta: age >= 65 ? -2 : age >= 45 ? -1 : 0 },
    { key: 'looks', delta: age >= 40 ? -1 : 0 },
  ]
  const text = pack.milestones[age]
  const aged = yearlyPeople({
    ...applyChanges(life, changes),
    age,
    energySpent: 0,
    restsThisYear: 0,
    doneThisYear: {},
    journal: text ? [...life.journal, { age, kind: 'milestone', text, changes: [] }] : life.journal,
  })
  return { ...peopleDeaths(aged, rng), rng: rng.state }
}
