import { describe, expect, it } from 'vitest'
import { applyChanges, isBenefit, roundAway } from './stats'
import { testLife } from './testLife'

describe('stats', () => {
  it('keeps stats within 0 and 100 and lets money go negative', () => {
    const life = applyChanges(testLife({ stats: { ...testLife().stats, health: 98, stress: 2 } }), [
      { key: 'health', delta: 5 }, { key: 'stress', delta: -5 }, { key: 'money', delta: -300000 },
    ])
    expect(life.stats.health).toBe(100)
    expect(life.stats.stress).toBe(0)
    expect(life.money).toBe(-85000)
  })
  it('treats falling stress as a benefit', () => {
    expect(isBenefit('stress', -3)).toBe(true)
    expect(isBenefit('stress', 3)).toBe(false)
    expect(isBenefit('health', 3)).toBe(true)
    expect(isBenefit('money', -1)).toBe(false)
  })
  it('rounds half away from zero', () => {
    expect([1.5, -1.5, 4.5, 2.4, -2.4].map(roundAway)).toEqual([2, -2, 5, 2, -2])
  })
})
