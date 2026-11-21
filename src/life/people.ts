import type { NameLists } from '../content/countries/indonesia/names'
import type { Rng } from '../engine/random'
import type { Gender, Life, Person } from './types'

export const MAX_FRIENDS = 8

const idNumber = (p: Person) => Number(p.id.slice(2))
const nextId = (people: Person[]) => `p-${Math.max(0, ...people.map(idNumber)) + 1}`

export function newFamily(rng: Rng, playerAge: number, names: NameLists, playerName = ''): Person[] {
  const taken = new Set(playerName.split(' '))
  const people: Person[] = []
  const add = (relation: Person['relation'], gender: Gender, age: number, closeness: number) => {
    const free = names[gender].filter((n) => !taken.has(n))
    const name = rng.pick(free)
    taken.add(name)
    people.push({ id: nextId(people), name, relation, gender, age, closeness })
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
  return { id: nextId(existing), name, relation: 'friend', gender, age: playerAge, closeness: 60 }
}

/** The family, plus a first friend from age 12; the draws that follow the stat rolls. */
export function startingPeople(rng: Rng, age: number, gender: Gender, name: string, names: NameLists): Person[] {
  const family = newFamily(rng, age, names, name)
  const friend = startingFriend(rng, age, names, gender, family, name)
  return friend ? [...family, friend] : family
}

export function addPerson(life: Life, person: Person): Life {
  const people = [...life.people, { ...person, id: nextId(life.people) }]
  const friends = people.filter((p) => p.relation === 'friend')
  if (friends.length <= MAX_FRIENDS) return { ...life, people }
  const least = friends.reduce((a, b) => (b.closeness < a.closeness ? b : a))
  return { ...life, people: people.filter((p) => p !== least) }
}

export function changeCloseness(life: Life, personId: string, delta: number): Life {
  if (!personById(life, personId)) return life
  return { ...life, people: life.people.map((p) => (p.id === personId ? { ...p, closeness: Math.min(100, Math.max(0, p.closeness + delta)) } : p)) }
}

export const personById = (life: Life, id: string): Person | undefined => life.people.find((p) => p.id === id)

export function yearlyPeople(life: Life): Life {
  const people = life.people.map((p) => ({ ...p, age: p.age + 1, closeness: life.spentWith.includes(p.id) ? p.closeness : Math.max(0, p.closeness - 3) }))
  return { ...life, people, spentWith: [] }
}
