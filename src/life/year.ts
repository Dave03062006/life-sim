import { schoolForAge } from './requirements'
import { NAMES } from '../content/countries/indonesia/names'
import { createRng } from '../engine/random'
import type { ContentPack } from '../content/types'
import { applySymptoms, catchIllnesses, closeIllnessYear, discover } from './illness'
import { deathCause } from './death'
import { openSchoolYear, closeSchoolYear } from './school'
import { closeMoneyYear, OWN_WAY_AGE } from './money'
import { closeWorkYear, currentStep } from './work'
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
    version: 5,
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
    school: schoolForAge(startAge),
    job: null,
    lifestyle: 'normal',
    ownWay: startAge >= 25,
    flags: [],
    belongings: [],
    illnesses: [],
  }
}

const towardFifty = (value: number): number => roundAway((50 - value) * 0.1)

/** The year ends: money settles first (it reads the closing year), then school and work. */
export function closeYear(life: Life, pack: ContentPack): Life {
  return closeWorkYear(closeSchoolYear(closeMoneyYear(life, pack)), pack)
}

/** The next year begins: a year older, the yearly changes, people, then school. */
export function openYear(life: Life, pack: ContentPack): Life {
  const rng = createRng(life.rng)
  const age = life.age + 1
  const { happiness, reputation } = life.stats
  const changes: Change[] = [
    { key: 'stress', delta: currentStep(life)?.step.hours === 'full' ? -5 : -10 },
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
  const dealt = peopleDeaths(aged, rng)
  const reset = { ...dealt, ownWay: life.ownWay || age >= OWN_WAY_AGE, illnesses: dealt.illnesses.map((i) => ({ ...i, treated: null })) }
  const ill = discover(applySymptoms(catchIllnesses(reset, pack, rng), pack), pack, 'symptoms')
  return openSchoolYear({ ...ill, rng: rng.state }, pack)
}

export function ageUp(life: Life, pack: ContentPack): Life {
  const closed = closeYear(life, pack)
  const rng = createRng(closed.rng)
  const cause = deathCause(closed, rng, pack)
  if (cause) {
    const entry = { age: closed.age, kind: 'milestone' as const, text: `You died at ${closed.age}. ${cause}.`, changes: [] }
    return { ...closed, rng: rng.state, death: { age: closed.age, cause }, journal: [...closed.journal, entry] }
  }
  const survived = closeIllnessYear(closed, pack, rng)
  return openYear({ ...survived, rng: rng.state }, pack)
}
