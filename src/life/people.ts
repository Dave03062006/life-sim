import type { NameLists } from '../content/countries/indonesia/names'
import type { Rng } from '../engine/random'
import { ACCIDENT, oldAgeChance } from './death'
import type { Gender, Life, Person } from './types'

export const MAX_FRIENDS = 8

const nextId = (ids: string[]) => `p-${Math.max(0, ...ids.map((id) => Number(id.slice(2)))) + 1}`
const ids = (people: Person[]) => people.map((p) => p.id)
/** Every id this life has used: the living, plus the dead and gone still named in memories and the journal. */
const usedIds = (life: Life) => [...ids(life.people), ...life.memories.flatMap((m) => m.people), ...life.journal.flatMap((e) => e.people?.map((p) => p.id) ?? [])]

export function newFamily(rng: Rng, playerAge: number, names: NameLists, playerName = ''): Person[] {
  const taken = new Set(playerName.split(' '))
  const people: Person[] = []
  const add = (relation: Person['relation'], gender: Gender, age: number, closeness: number) => {
    const free = names[gender].filter((n) => !taken.has(n))
    const name = rng.pick(free)
    taken.add(name)
    people.push({ id: nextId(ids(people)), name, relation, gender, age, closeness })
    return age
  }
  const roll = (min: number, max: number) => rng.int(min, max + 1)
  const motherAge = add('mother', 'female', playerAge + roll(22, 35), 70)
  add('father', 'male', playerAge + roll(24, 38), 70)
  const siblings = roll(0, 3)
  for (let i = 0; i < siblings; i++) {
    const gender: Gender = rng.next() < 0.5 ? 'female' : 'male'
    const age = Math.min(playerAge + roll(-10, 10), motherAge - 18)
    add('sibling', gender, Math.max(0, age), 55)
  }
  const parentAges = people.slice(0, 2).map((p) => p.age)
  for (const [parentAge, gender] of [[parentAges[0]!, 'female'], [parentAges[0]!, 'male'], [parentAges[1]!, 'female'], [parentAges[1]!, 'male']] as const) {
    const alive = rng.next() < 0.6
    const age = parentAge + roll(20, 30)
    if (alive && age < 90) add('grandparent', gender, age, 60)
  }
  return people
}

export function startingFriend(rng: Rng, playerAge: number, names: NameLists, gender: Gender, existing: Person[], playerName = ''): Person | null {
  if (playerAge < 12) return null
  const taken = new Set([...playerName.split(' '), ...existing.map((p) => p.name)])
  const name = rng.pick(names[gender].filter((n) => !taken.has(n)))
  return { id: nextId(ids(existing)), name, relation: 'friend', gender, age: playerAge, closeness: 60 }
}

/** The family, plus a first friend from age 12; the draws that follow the stat rolls. */
export function startingPeople(rng: Rng, age: number, gender: Gender, name: string, names: NameLists): Person[] {
  const family = newFamily(rng, age, names, name)
  const friend = startingFriend(rng, age, names, gender, family, name)
  return friend ? [...family, friend] : family
}

const clamp = (n: number) => Math.min(100, Math.max(0, n))

export function addPerson(life: Life, person: Person): Life {
  const people = [...life.people, { ...person, id: nextId(usedIds(life)), closeness: clamp(person.closeness) }]
  const friends = life.people.filter((p) => p.relation === 'friend') // the newcomer never drifts away
  if (person.relation !== 'friend' || friends.length < MAX_FRIENDS) return { ...life, people }
  const least = friends.reduce((a, b) => (b.closeness < a.closeness ? b : a))
  return { ...life, people: people.filter((p) => p !== least) }
}

export function changeCloseness(life: Life, personId: string, delta: number): Life {
  if (!personById(life, personId)) return life
  return { ...life, people: life.people.map((p) => (p.id === personId ? { ...p, closeness: clamp(p.closeness + delta) } : p)) }
}

export const personById = (life: Life, id: string): Person | undefined => life.people.find((p) => p.id === id)

export function yearlyPeople(life: Life): Life {
  const people = life.people.map((p) => ({ ...p, age: p.age + 1, closeness: life.spentWith.includes(p.id) ? p.closeness : Math.max(0, p.closeness - 3) }))
  return { ...life, people, spentWith: [] }
}

const RELATION_WORD: Record<Person['relation'], string | Record<Person['gender'], string>> = {
  mother: 'mother', father: 'father', sibling: { female: 'sister', male: 'brother' },
  grandparent: { female: 'grandmother', male: 'grandfather' }, friend: 'friend', crush: 'crush', partner: 'partner',
}

/** Everyone else ages by your odds, without your Health: each dies of old age or a rare accident. */
export function peopleDeaths(life: Life, rng: Rng): Life {
  let next = life
  for (const p of life.people) {
    if (rng.next() >= oldAgeChance(p.age, null) && rng.next() >= ACCIDENT) continue
    const word = RELATION_WORD[p.relation]
    const text = `Your ${typeof word === 'string' ? word : word[p.gender]} ${p.name} died, aged ${p.age}.`
    next = {
      ...next,
      people: next.people.filter((q) => q.id !== p.id),
      journal: [...next.journal, { age: life.age, kind: 'milestone', text, changes: [] }],
      memories: [...next.memories, { id: `death-${p.id}`, age: life.age, text, people: [p.id] }],
    }
  }
  return next
}

/** changeCloseness plus the real change (none when capped or gone), for the journal. */
export function nudgeCloseness(life: Life, personId: string, delta: number): { life: Life; moved: { id: string; delta: number }[] } {
  const before = personById(life, personId)?.closeness ?? 0
  const next = changeCloseness(life, personId, delta)
  const moved = (personById(next, personId)?.closeness ?? 0) - before
  return { life: next, moved: moved ? [{ id: personId, delta: moved }] : [] }
}
