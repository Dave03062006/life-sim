// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { packFor } from '../content'
import { CAUSE } from '../life/death'
import { simulateLife } from './simulate'

const LIVES = Number(process.env.SIMULATE_LIVES ?? 1000)

describe('simulateLife', () => {
  it('plays random lives to a believable end (1,000 here; npm run simulate plays 10,000)', () => {
    const pack = packFor('indonesia')
    const sims = Array.from({ length: LIVES }, (_, i) => simulateLife(i + 1, pack))
    const deaths = sims.map((s) => s.life.death)
    const ages = deaths.map((d) => d?.age ?? -1).sort((a, b) => a - b)
    const share = (cause: string) => deaths.filter((d) => d?.cause === cause).length / deaths.length
    const median = ages[Math.floor(LIVES / 2)]!
    expect(deaths.every((d) => d !== null)).toBe(true)
    expect(median).toBeGreaterThanOrEqual(65)
    expect(median).toBeLessThanOrEqual(86) // spec 5.12 odds alone put random play near 83 before illness exists; Plan 6 adds illness and retightens this
    expect(share(CAUSE.accident)).toBeLessThan(0.05) // 0.05% a year over ~80 years: 1 - 0.9995^80 ≈ 3.9%
    expect(share(CAUSE.health)).toBeLessThan(0.3)
    const jobShare = sims.filter((s) => s.jobAt30).length / LIVES
    const money = sims.map((s) => s.moneyAt40).filter((m): m is number => m !== null).sort((a, b) => a - b)
    const medianMoney = money[Math.floor(money.length / 2)]!
    expect(jobShare).toBeGreaterThanOrEqual(0.5)
    expect(medianMoney).toBeGreaterThan(0)
    const offered = new Set(sims.flatMap((s) => [...s.offered]))
    const unreachable = pack.activities.map((a) => a.id).filter((id) => !offered.has(id))
    expect(unreachable).toEqual([]) // spec 10.6: no activity is unreachable
    console.log(`lives ${LIVES}: median ${median}, oldest ${ages[LIVES - 1]}, accident ${share(CAUSE.accident)}, health ${share(CAUSE.health)}, job at 30 ${jobShare}, median money at 40 ${medianMoney}`)
  }, 600000)
})
