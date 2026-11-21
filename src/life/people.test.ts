import { describe, expect, it } from 'vitest'
import { NAMES } from '../content/countries/indonesia/names'
import { createRng } from '../engine/random'
import { addPerson, changeCloseness, MAX_FRIENDS, newFamily, personById, startingFriend, yearlyPeople } from './people'
import { testLife } from './testLife'
import type { Person } from './types'

const friend = (closeness: number): Person => ({ id: 'x', name: `F${closeness}`, relation: 'friend', gender: 'male', age: 16, closeness })

describe('people', () => {
  it('builds a believable family from a seed', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const fam = newFamily(createRng(seed), 15, NAMES, 'Raka Pratama')
      const mother = fam.find((p) => p.relation === 'mother')!
      expect(mother.age >= 37 && mother.age <= 50).toBe(true)
      expect(fam.filter((p) => p.relation === 'sibling').length).toBeLessThanOrEqual(3)
      expect(fam.filter((p) => p.relation === 'sibling').every((s) => s.age <= mother.age - 18 && Math.abs(s.age - 15) <= 10)).toBe(true)
      expect(fam.filter((p) => p.relation === 'grandparent').every((g) => g.age < 90)).toBe(true)
      expect(new Set(fam.map((p) => p.id)).size).toBe(fam.length)
      expect(fam.some((p) => p.name === 'Raka')).toBe(false)
    }
    expect(newFamily(createRng(4), 15, NAMES)).toEqual(newFamily(createRng(4), 15, NAMES))
  })

  it('gives a same-age friend of the same gender only from age 12', () => {
    expect(startingFriend(createRng(1), 11, NAMES, 'male', [])).toBeNull()
    expect(startingFriend(createRng(1), 12, NAMES, 'female', [{ ...friend(1), id: 'p-4' }])).toMatchObject({ id: 'p-5', relation: 'friend', gender: 'female', age: 12, closeness: 60 })
  })

  it('keeps at most eight friends, dropping the least close', () => {
    let life = testLife({ people: [] })
    for (let c = 10; c <= 90; c += 10) life = addPerson(life, friend(c))
    const friends = life.people.filter((p) => p.relation === 'friend')
    expect(friends).toHaveLength(MAX_FRIENDS)
    expect(friends.some((p) => p.closeness === 10)).toBe(false)
    expect(new Set(life.people.map((p) => p.id)).size).toBe(MAX_FRIENDS)
  })

  it('numbers a new person one past the highest id', () => {
    expect(addPerson(testLife(), friend(50)).people.at(-1)!.id).toBe('p-4')
  })

  it('clamps closeness and ignores unknown people', () => {
    const life = testLife()
    expect(personById(changeCloseness(life, 'p-3', 50), 'p-3')!.closeness).toBe(100)
    expect(personById(changeCloseness(life, 'p-3', -200), 'p-3')!.closeness).toBe(0)
    expect(changeCloseness(life, 'nobody', 5)).toBe(life)
  })

  it('ages everyone and lets unseen people drift', () => {
    const life = yearlyPeople(testLife({ spentWith: ['p-3'] }))
    expect(personById(life, 'p-3')!.closeness).toBe(60)
    expect(personById(life, 'p-1')!.closeness).toBe(testLife().people[0]!.closeness - 3)
    expect(life.spentWith).toEqual([])
    expect(personById(life, 'p-1')!.age).toBe(testLife().people[0]!.age + 1)
  })
})
