import { expect, it } from 'vitest'
import { CLOSING_LINES, summaryOf } from './summary'
import { testLife } from './testLife'

const dead = testLife({
  age: 82,
  death: { age: 82, cause: 'Old age' },
  memories: [
    { id: 'b', age: 40, text: 'Later.', people: [] },
    { id: 'a', age: 12, text: 'Earlier.', people: [] },
  ],
  people: [
    { id: 'p-3', name: 'Dimas', relation: 'friend', gender: 'male', age: 82, closeness: 40 },
    { id: 'p-4', name: 'Ayu', relation: 'partner', gender: 'female', age: 80, closeness: 90 },
  ],
})

it('sums up a life that ended', () => {
  const s = summaryOf(dead)
  expect(s).toMatchObject({ name: 'Raka Pratama', age: 82, ended: 'died', cause: 'Old age', netWorth: 215000, stats: dead.stats })
  expect(s.memories.map((m) => m.id)).toEqual(['a', 'b'])
  expect(s.leftBehind.map((p) => p.id)).toEqual(['p-4', 'p-3'])
  expect(CLOSING_LINES.old).toContain(s.closing)
})

it('adds belongings to net worth', () => {
  expect(summaryOf(testLife({ belongings: ['motorbike'] })).netWorth).toBe(215000 + 5_500_000)
})

it('sums up an unfinished life', () => {
  const s = summaryOf(testLife())
  expect(s).toMatchObject({ ended: 'unfinished', cause: null })
  expect(CLOSING_LINES.unfinished).toContain(s.closing)
})

it('picks the same closing line every time, by age band', () => {
  expect(summaryOf(dead).closing).toBe(summaryOf(dead).closing)
  expect(CLOSING_LINES.young).toContain(summaryOf(testLife({ age: 29, death: { age: 29, cause: 'An accident' } })).closing)
  expect(CLOSING_LINES.middle).toContain(summaryOf(testLife({ age: 30, death: { age: 30, cause: 'An accident' } })).closing)
  expect(CLOSING_LINES.old).toContain(summaryOf(testLife({ age: 70, death: { age: 70, cause: 'Old age' } })).closing)
  for (const lines of Object.values(CLOSING_LINES)) expect(lines.length).toBeGreaterThanOrEqual(2)
})
