import { CITIES } from '../content/countries/indonesia/cities'
import { NAMES } from '../content/countries/indonesia/names'
import { createRng } from '../engine/random'
import type { Gender, Wealth } from './types'

export const WEALTH_LABEL: Record<Wealth, string> = { struggling: 'Struggling', 'getting-by': 'Getting by', comfortable: 'Comfortable', 'well-off': 'Well off' }

export interface LifeRoll { seed: number; name: string; gender: Gender; city: string; wealth: Wealth }

export const MAX_NAME = 40

export const cleanName = (name: string): string => name.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME)

/** Who you are born as. Its own generator, so it does not line up with newLife's stat rolls. */
export function rollLife(seed: number): LifeRoll {
  const rng = createRng(seed ^ 0x9e3779b9)
  const gender: Gender = rng.next() < 0.5 ? 'female' : 'male'
  const first = rng.pick(NAMES[gender])
  const second = rng.pick(NAMES[gender].filter((n) => n !== first))
  const city = rng.pick(CITIES)
  const r = rng.next()
  const wealth: Wealth = r < 0.25 ? 'struggling' : r < 0.7 ? 'getting-by' : r < 0.92 ? 'comfortable' : 'well-off'
  return { seed, name: `${first} ${second}`, gender, city, wealth }
}
