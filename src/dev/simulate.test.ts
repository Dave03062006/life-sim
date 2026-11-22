// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { packFor } from '../content'
import { CAUSE } from '../life/death'
import { simulateLife } from './simulate'

const LIVES = Number(process.env.SIMULATE_LIVES ?? 1000)

describe('simulateLife', () => {
  it('plays random lives to a believable end (1,000 here; npm run simulate plays 10,000)', () => {
    const pack = packFor('indonesia')
    const deaths = Array.from({ length: LIVES }, (_, i) => simulateLife(i + 1, pack).death)
    const ages = deaths.map((d) => d?.age ?? -1).sort((a, b) => a - b)
    const share = (cause: string) => deaths.filter((d) => d?.cause === cause).length / deaths.length
    const median = ages[Math.floor(LIVES / 2)]!
    expect(deaths.every((d) => d !== null)).toBe(true)
    expect(median).toBeGreaterThanOrEqual(65)
    expect(median).toBeLessThanOrEqual(86) // spec 5.12 odds alone put random play near 83 before illness exists; Plan 6 adds illness and retightens this
    expect(share(CAUSE.accident)).toBeLessThan(0.05) // 0.05% a year over ~80 years: 1 - 0.9995^80 ≈ 3.9%
    expect(share(CAUSE.health)).toBeLessThan(0.3)
    console.log(`lives ${LIVES}: median ${median}, oldest ${ages[LIVES - 1]}, accident ${share(CAUSE.accident)}, health ${share(CAUSE.health)}`)
  }, 600000)
})
