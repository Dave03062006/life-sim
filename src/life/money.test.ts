import { describe, expect, it } from 'vitest'
import { packFor } from '../content'
import { ALLOWANCE, DEBT_STRESS, LIVING_WITH_FAMILY, closeMoneyYear, netWorth, sell, sellBlocked, setLifestyle } from './money'
import { testLife } from './testLife'
import { energyBudget } from './energy'
import { closeYear } from './year'
import { finishActivity, offersFor } from './activities'
import type { Life } from './types'

const pack = packFor('indonesia')
const grown: Partial<Life> = { age: 26, ownWay: true, money: 0, school: { ...testLife().school, at: null } }
const clerk = (more: Partial<Life> = {}) => testLife({ ...grown, job: { careerId: 'office', step: 0, performance: 50, years: 0 }, ...more })
const def = (id: string) => pack.activities.find((a) => a.id === id)!
const offer = (life: Life, category: 'money' | 'health', id: string) => offersFor(life, category, pack).find((o) => o.def.id === id)

describe('money', () => {
  it('pays a well-off 13-year-old double allowance', () => {
    const closed = closeMoneyYear(testLife({ age: 13, wealth: 'well-off', money: 0 }), pack)
    expect(closed.money).toBe(ALLOWANCE['well-off'] * 2)
    expect(closed.money).toBe(6_000_000)
  })

  it('sends a 26-year-old with no job into debt and Stress', () => {
    const life = testLife({ ...grown, age: 26 })
    const closed = closeMoneyYear(life, pack)
    expect(closed.money).toBe(-42_000_000)
    expect(closed.stats.stress).toBe(life.stats.stress + DEBT_STRESS)
    expect(closed.journal.at(-1)?.text).toBe('You are in debt: −Rp 42.000.000.')
  })

  it('nets salary minus frugal living with a house', () => {
    const closed = closeMoneyYear(clerk({ lifestyle: 'frugal', belongings: ['house'] }), pack)
    expect(closed.money).toBe(48_000_000 - 9_000_000)
  })

  it('pays 2% interest only with a bank account', () => {
    const base = { ...grown, age: 20, ownWay: false, money: 10_000_000 }
    expect(closeMoneyYear(testLife({ ...base, flags: ['bank'] }), pack).money).toBe(10_200_000)
    expect(closeMoneyYear(testLife(base), pack).money).toBe(10_000_000)
  })

  it('charges for a child of 17 but not 18', () => {
    const kid = (age: number) => ({ id: 'c', name: 'Adi', relation: 'child' as const, gender: 'male' as const, age, closeness: 80 })
    const run = (age: number) => closeMoneyYear(testLife({ ...grown, age: 40, money: 0, people: [kid(age)] }), pack).money
    expect(run(17)).toBe(-42_000_000 - 9_000_000)
    expect(run(18)).toBe(-42_000_000)
  })

  it('charges BPJS from 18 with the flag, and sets ownWay at 25', () => {
    const life = testLife({ ...grown, age: 25, ownWay: false, flags: ['bpjs'], money: 100_000_000 })
    const closed = closeMoneyYear(life, pack)
    expect(closed.ownWay).toBe(true)
    expect(closed.money).toBe(100_000_000 - 42_000_000 - 420_000)
  })

  it('writes one line listing the year in a fixed order, and none when nothing moved', () => {
    const closed = closeMoneyYear(clerk({ money: 100_000_000 }), pack)
    expect(closed.journal.at(-1)).toMatchObject({ text: 'This year: salary Rp 48.000.000, living costs Rp 42.000.000.', changes: [{ key: 'money', delta: 6_000_000 }] })
    const quiet = testLife({ age: 20, ownWay: false, money: 5, school: { ...testLife().school, at: null } })
    expect(closeMoneyYear(quiet, pack).journal).toEqual([])
  })

  it('moves Happiness and Health by lifestyle', () => {
    const life = testLife({ ...grown, lifestyle: 'comfortable', money: 200_000_000, stats: { ...testLife().stats, happiness: 50, health: 50 } })
    expect(closeMoneyYear(life, pack).stats).toMatchObject({ happiness: 53, health: 51 })
  })

  it('pays no allowance to a full-time worker or past 17', () => {
    const worker = testLife({ age: 17, ownWay: true, money: 0, job: { careerId: 'office', step: 0, performance: 50, years: 0 } })
    expect(closeMoneyYear(worker, pack).money).toBe(48_000_000 - 42_000_000)
    expect(closeMoneyYear(testLife({ age: 18, money: 0, ownWay: false }), pack).money).toBe(0)
  })

  it('lands salary and the uni fee in closeYear as one line', () => {
    const closed = closeYear(clerk({ money: 0 }), pack)
    expect(closed.journal.filter((e) => e.text.startsWith('This year')).map((e) => e.text)).toEqual(['This year: salary Rp 48.000.000, living costs Rp 42.000.000.'])
    const student = testLife({ age: 19, ownWay: false, money: 50_000_000, school: { ...testLife().school, at: 'uni', year: 0, field: 'business', funding: 'self' } })
    expect(closeYear(student, pack).money).toBe(40_000_000)
  })

  it('switches lifestyle only once you live your own way', () => {
    expect(() => setLifestyle(testLife(), 'frugal')).toThrow(LIVING_WITH_FAMILY)
    const done = setLifestyle(testLife({ ownWay: true }), 'frugal')
    expect(done.lifestyle).toBe('frugal')
    expect(done.journal.at(-1)?.text).toBe('You switched to a frugal lifestyle.')
  })

  it('sells a belonging unless the job needs it', () => {
    const rider = testLife({ ...grown, belongings: ['motorbike'], job: { careerId: 'driving', step: 0, performance: 50, years: 0 } })
    expect(sellBlocked(rider, 'motorbike', pack)).toBe('Your job as an ojek driver needs it. Quit first.')
    expect(sellBlocked(testLife(), 'motorbike', pack)).toBe("You don't own that.")
    expect(() => sell(rider, 'motorbike', pack)).toThrow('Your job as an ojek driver needs it. Quit first.')
    const sold = sell(testLife({ belongings: ['motorbike'], money: 0 }), 'motorbike', pack)
    expect(sold).toMatchObject({ money: 3_000_000, belongings: [] })
    expect(sold.journal.at(-1)?.text).toBe('You sold your motorbike for Rp 3.000.000.')
  })

  it('buys once, adds energy, and counts belongings in net worth', () => {
    const rich = testLife({ age: 20, money: 10_000_000 })
    expect(offer(rich, 'money', 'motorbike')?.blocked).toBeNull()
    const bought = finishActivity(rich, def('motorbike'), 1).life
    expect(bought.belongings).toEqual(['motorbike'])
    expect(offer(bought, 'money', 'motorbike')?.blocked).toBe('You already have one.')
    expect(energyBudget(bought)).toBe(energyBudget(rich) + 1)
    expect(netWorth(bought, pack)).toBe(bought.money + 3_000_000)
    expect(offer(testLife({ age: 20, money: 200_000_000 }), 'money', 'buy-car')?.blocked).toBeNull()
  })

  it('joins BPJS once, from 18', () => {
    const joined = finishActivity(testLife({ age: 20 }), def('join-bpjs'), 1).life
    expect(joined.flags).toContain('bpjs')
    expect(offer(joined, 'health', 'join-bpjs')?.blocked).toBe('You are already in BPJS.')
    expect(offer(testLife({ age: 17 }), 'health', 'join-bpjs')).toBeUndefined()
  })
})
