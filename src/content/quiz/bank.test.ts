import { expect, it } from 'vitest'
import { QUESTIONS } from './bank'

it('has a sound bank', () => {
  expect(QUESTIONS.length).toBeGreaterThanOrEqual(40)
  expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length)
  for (const s of ['maths', 'science', 'english', 'indonesia', 'general'] as const) expect(QUESTIONS.filter((q) => q.subject === s).length).toBeGreaterThanOrEqual(6)
  expect(QUESTIONS.filter((q) => q.subject === 'chat').length).toBeGreaterThanOrEqual(10)
  for (const q of QUESTIONS) expect({ id: q.id, distinct: new Set(q.choices).size }).toEqual({ id: q.id, distinct: 4 })
})
