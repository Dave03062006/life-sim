import { packFor } from '../content'
import { illnessEnergy } from './illness'
import { stageOf } from './stages'
import { currentStep, RESERVE } from './work'
import type { Life } from './types'

export const OVERWORK_STRESS = 4
export const OVERWORK_HEALTH = -2
export const MIN_BUDGET = 2

export function energyBudget(life: Life): number {
  const cut = (life.stats.health < 30 ? 2 : 0) + (life.stats.stress >= 70 ? 2 : 0)
  const held = currentStep(life)
  const pack = packFor(life.country)
  const extra = life.belongings.reduce((sum, id) => sum + (pack.belongings.find((b) => b.id === id)?.energy ?? 0), 0)
  return Math.max(MIN_BUDGET, stageOf(life.age).energy - cut - illnessEnergy(life, pack) - (held ? RESERVE[held.step.hours] : 0) + extra)
}

export const energyLeft = (life: Life): number => energyBudget(life) - life.energySpent

/** Points of `cost` that land below zero. */
export const overworkPoints = (life: Life, cost: number): number => Math.min(cost, Math.max(0, cost - Math.max(0, energyLeft(life))))

export const restGain = (life: Life, base: number): number =>
  Math.max(0, Math.min(base - life.restsThisYear, life.energySpent))

export const repeatScale = (timesDone: number): number => 1 / (1 + timesDone)
