import type { Life, Person } from './types'

export const MARRY_AGE = 19
export const PROPOSE_CLOSENESS = 70
export const PARTNER_YEARS = 3
export const MAX_CHILDREN = 4
export const BABY_AGE_MAX = 45
export const WEDDING = { small: 15_000_000, big: 80_000_000 }

export const spouse = (life: Life): Person | undefined => life.people.find((p) => p.relation === 'spouse')
export const children = (life: Life): Person[] => life.people.filter((p) => p.relation === 'child')

/** A partner becomes your spouse; anyone else is left alone. */
export function marry(life: Life, personId: string): Life {
  const person = life.people.find((p) => p.id === personId && p.relation === 'partner')
  if (!person) return life
  return {
    ...life,
    people: life.people.map((p) => (p === person ? { ...p, relation: 'spouse', since: life.age } : p)),
    // a new marriage can have the baby talk again, and the first 'married' memory stays
    memories: [...life.memories.filter((m) => m.id !== 'no-kids' && m.id !== 'married'), { id: 'married', age: life.age, text: `You married ${person.name}.`, people: [personId] }],
  }
}
