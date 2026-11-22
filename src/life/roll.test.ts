import { describe, expect, it } from 'vitest'
import { CITIES } from '../content/countries/indonesia/cities'
import { NAMES } from '../content/countries/indonesia/names'
import { cleanName, MAX_NAME, rollLife } from './roll'
import { newLife } from './year'
import type { Wealth } from './types'

describe('rollLife', () => {
  it('is repeatable and picks a name, city and wealth', () => {
    expect(rollLife(7)).toEqual(rollLife(7))
    for (let seed = 1; seed <= 50; seed++) {
      const r = rollLife(seed)
      const [a, b, ...rest] = r.name.split(' ')
      expect(rest).toEqual([])
      expect(a).not.toBe(b)
      expect(NAMES[r.gender]).toEqual(expect.arrayContaining([a, b]))
      expect(CITIES).toContain(r.city)
    }
  })
  it('rolls wealth with the set shares', () => {
    const count: Record<Wealth, number> = { struggling: 0, 'getting-by': 0, comfortable: 0, 'well-off': 0 }
    for (let seed = 1; seed <= 2000; seed++) count[rollLife(seed).wealth]++
    const share = (w: Wealth) => count[w] / 20
    expect(Math.abs(share('struggling') - 25)).toBeLessThanOrEqual(3)
    expect(Math.abs(share('getting-by') - 45)).toBeLessThanOrEqual(3)
    expect(Math.abs(share('comfortable') - 22)).toBeLessThanOrEqual(3)
    expect(Math.abs(share('well-off') - 8)).toBeLessThanOrEqual(3)
  })
  it('does not tie gender to Health', () => {
    const sum = { female: 0, male: 0 }
    const n = { female: 0, male: 0 }
    for (let seed = 1; seed <= 2000; seed++) {
      const g = rollLife(seed).gender
      sum[g] += newLife({ seed }).stats.health
      n[g]++
    }
    expect(Math.abs(sum.female / n.female - sum.male / n.male)).toBeLessThanOrEqual(3)
  })
})

describe('cleanName', () => {
  it('trims, collapses spaces and cuts to the limit', () => {
    expect(cleanName('  Dewi   Lestari ')).toBe('Dewi Lestari')
    expect(cleanName('a'.repeat(60))).toHaveLength(MAX_NAME)
  })
})
