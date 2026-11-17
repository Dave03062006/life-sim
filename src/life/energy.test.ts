import { describe, expect, it } from 'vitest'
import { energyBudget, energyLeft, overworkPoints, repeatScale, restGain } from './energy'
import type { Life, Stats } from './types'
import { testLife } from './testLife'

const withStats = (s: Partial<Stats>, more: Partial<Life> = {}) => testLife({ stats: { ...testLife().stats, ...s }, ...more })
describe('energy', () => {
  it('sets the budget from the stage, health and stress', () => {
    expect(energyBudget(testLife())).toBe(10)
    expect(energyBudget(withStats({ health: 29 }))).toBe(8)
    expect(energyBudget(withStats({ stress: 70 }))).toBe(8)
    expect(energyBudget(withStats({ health: 29, stress: 70 }))).toBe(6)
    expect(energyBudget(withStats({ health: 20, stress: 80 }, { age: 1 }))).toBe(2)
  })
  it('lets energy go far below zero', () => {
    expect(energyLeft(testLife({ energySpent: 30 }))).toBe(-20)
    expect(overworkPoints(testLife({ energySpent: 30 }), 2)).toBe(2)
  })
  it('counts only the points that fall below zero as overwork', () => {
    expect(overworkPoints(testLife({ energySpent: 9 }), 2)).toBe(1)
    expect(overworkPoints(testLife({ energySpent: 5 }), 2)).toBe(0)
  })
  it('gives less from each rest and never more than was spent', () => {
    expect(restGain(testLife({ energySpent: 5 }), 3)).toBe(3)
    expect(restGain(testLife({ energySpent: 5, restsThisYear: 1 }), 3)).toBe(2)
    expect(restGain(testLife({ energySpent: 5, restsThisYear: 3 }), 3)).toBe(0)
    expect(restGain(testLife({ energySpent: 1 }), 3)).toBe(1)
    expect(restGain(testLife(), 3)).toBe(0)
  })
  it('shrinks repeats', () => {
    expect([0, 1, 3].map(repeatScale)).toEqual([1, 0.5, 0.25])
  })
})
