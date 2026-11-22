import { describe, expect, it } from 'vitest'
import { children, marry, spouse, WEDDING } from './family'
import { testLife } from './testLife'
import type { Person } from './types'

const rani: Person = { id: 'p-4', name: 'Rani', relation: 'partner', gender: 'female', age: 25, closeness: 80, since: 20 }
const kid: Person = { id: 'p-5', name: 'Adi', relation: 'child', gender: 'male', age: 2, closeness: 80 }

describe('family', () => {
  it('marries a partner: spouse, since your age, and a memory', () => {
    const life = testLife({ age: 26, people: [...testLife().people, rani] })
    const wed = marry(life, 'p-4')
    expect(spouse(wed)).toMatchObject({ id: 'p-4', relation: 'spouse', since: 26 })
    expect(wed.memories).toEqual([{ id: 'married-p-4', age: 26, text: 'You married Rani.', people: ['p-4'] }])
    expect(spouse(life)).toBeUndefined()
  })
  it('clears no-kids on a new marriage', () => {
    const old = { id: 'married-p-9', age: 20, text: 'You married Tia.', people: ['p-9'] }
    const life = testLife({ age: 40, memories: [old, { id: 'no-kids', age: 22, text: 'x', people: ['p-9'] }], people: [...testLife().people, rani] })
    const wed = marry(life, 'p-4')
    expect(wed.memories.map((m) => m.id)).toEqual(['married-p-9', 'married-p-4'])
  })
  it('gives a widowed player two marriage memories', () => {
    const old = { id: 'married-p-9', age: 20, text: 'You married Tia.', people: ['p-9'] }
    const wed = marry(testLife({ age: 40, memories: [old], people: [...testLife().people, rani] }), 'p-4')
    expect(wed.memories.map((m) => m.id)).toEqual(['married-p-9', 'married-p-4'])
  })
  it('leaves anyone who is not a partner alone', () => {
    const life = testLife()
    expect(marry(life, 'p-3')).toBe(life)
  })
  it('lists your children and prices weddings', () => {
    expect(children(testLife({ people: [...testLife().people, kid] }))).toEqual([kid])
    expect(WEDDING).toEqual({ small: 15_000_000, big: 80_000_000 })
  })
})
