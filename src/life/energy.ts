import { stageOf } from './stages'
import type { Life } from './types'

export const OVERWORK_STRESS = 4
export const OVERWORK_HEALTH = -2
export const MIN_BUDGET = 2

export function energyBudget(life: Life): number {
  const cut = (life.stats.health < 30 ? 2 : 0) + (life.stats.stress >= 70 ? 2 : 0)
  return Math.max(MIN_BUDGET, stageOf(life.age).energy - cut)
}

export const energyLeft = (life: Life): number => energyBudget(life) - life.energySpent

/** Points of `cost` that land below zero. */
export const overworkPoints = (life: Life, cost: number): number => Math.min(cost, Math.max(0, cost - Math.max(0, energyLeft(life))))

export const restGain = (life: Life, base: number): number =>
  Math.max(0, Math.min(base - life.restsThisYear, life.energySpent))

export const repeatScale = (timesDone: number): number => 1 / (1 + timesDone)
