// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { packFor } from '../content'
import { CAUSE } from '../life/death'
import { simulateLife } from './simulate'

describe('simulateLife', () => {
  it('plays 10,000 random lives to a believable end', () => {
    const pack = packFor('indonesia')
    const deaths = Array.from({ length: 10000 }, (_, i) => simulateLife(i + 1, pack).death)
    const ages = deaths.map((d) => d?.age ?? -1).sort((a, b) => a - b)
    const share = (cause: string) => deaths.filter((d) => d?.cause === cause).length / deaths.length
    const median = ages[5000]!
    expect(deaths.every((d) => d !== null)).toBe(true)
    expect(median).toBeGreaterThanOrEqual(65)
    expect(median).toBeLessThanOrEqual(82)
    expect(share(CAUSE.accident)).toBeLessThan(0.05) // 0.05% a year over ~80 years: 1 - 0.9995^80 ≈ 3.9%
    expect(share(CAUSE.health)).toBeLessThan(0.3)
  }, 600000) // 10,000 lives with something to do at every age take about three minutes
})
