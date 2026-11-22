import type { Rng } from '../engine/random'
import type { ContentPack } from '../content/types'
import { illnessDeath } from './illness'
import type { Life } from './types'

export const OLD_AGE: readonly [from: number, chance: number][] = [[115, 1], [100, 0.6], [90, 0.3], [80, 0.12], [70, 0.04], [60, 0.01]]
export const ACCIDENT = 0.0005
export const CAUSE = { health: 'Health gave out', oldAge: 'Old age', accident: 'An accident' } as const

/** The yearly chance of dying of old age; health null (other people) leaves it unscaled. */
export function oldAgeChance(age: number, health: number | null): number {
  const base = OLD_AGE.find(([from]) => age >= from)?.[1] ?? 0
  const scaled = health === null || age >= 115 ? base : health >= 80 ? base * 0.5 : health < 30 ? base * 2 : base // certain from 115, whatever the Health
  return Math.min(1, scaled)
}

/** Checked at Age Up: Health 0, then illness, then old age, then a rare accident. */
export function deathCause(life: Life, rng: Rng, pack?: ContentPack): string | null {
  if (life.stats.health <= 0) return CAUSE.health
  const sick = pack && illnessDeath(life, pack, rng)
  if (sick) return sick
  if (rng.next() < oldAgeChance(life.age, life.stats.health)) return CAUSE.oldAge
  return rng.next() < ACCIDENT ? CAUSE.accident : null
}
