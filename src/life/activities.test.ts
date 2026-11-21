import { describe, expect, it } from 'vitest'
import { packFor } from '../content'
import { finishActivity, GOOD_SCORE, offersFor, tierOf } from './activities'
import { testLife } from './testLife'
import type { Life } from './types'

const pack = packFor('indonesia')
const act = (id: string) => pack.activities.find((a) => a.id === id)!
const offer = (life: Life, id: string) => offersFor(life, act(id).category, pack).find((o) => o.def.id === id)!

describe('activities', () => {
  it('turns a score into a result', () => {
    expect([0, 0.24, 0.25, 0.49, 0.5, 0.84, 0.85, 1].map(tierOf)).toEqual(['fail', 'fail', 'weak', 'weak', 'good', 'good', 'great', 'great'])
  })
  it('scales benefits by the result and leaves costs alone', () => {
    const stats = (score: number) => finishActivity(testLife(), act('jog'), score).life.stats
    expect([stats(0.9).health, stats(0.9).stress]).toEqual([63, 32])
    expect([stats(0.6).health, stats(0.6).stress]).toEqual([61, 33])
    expect([stats(0.3).health, stats(0.3).stress]).toEqual([60, 34])
    const studied = finishActivity(testLife(), act('study-exam'), 0.3).life.stats
    expect([studied.smarts, studied.stress]).toEqual([67, 38])
  })
  it('applies the penalty and no benefit on a fail', () => {
    const { life, tier, entry } = finishActivity(testLife(), act('futsal'), 0.1)
    expect(tier).toBe('fail')
    expect([life.stats.health, life.stats.happiness, life.stats.looks, life.stats.stress]).toEqual([55, 69, 49, 35])
    expect(entry.text).toContain('pulled a muscle')
  })
  it('shrinks a repeat', () => {
    const once = testLife({ doneThisYear: { jog: 1 } })
    const s = finishActivity(once, act('jog'), 0.6).life
    expect([s.stats.health, s.stats.stress, s.doneThisYear.jog]).toEqual([60, 34, 2])
  })
  it('charges overwork for points below zero, however far below', () => {
    const tired = finishActivity(testLife({ energySpent: 9 }), act('gym'), 0.6)
    expect([tired.life.stats.health, tired.life.stats.looks, tired.life.stats.stress, tired.life.money, tired.life.energySpent]).toEqual([60, 52, 39, 185000, 11])
    expect(tired.entry.text).toMatch(/already worn out\.$/)
    const spent = finishActivity(testLife({ energySpent: 30 }), act('jog'), 0.6).life
    expect([spent.stats.stress, spent.energySpent]).toEqual([35 - 2 + 4, 31])
  })
  it('restores less with each rest', () => {
    const first = finishActivity(testLife({ energySpent: 5 }), act('sleep-in'), GOOD_SCORE)
    expect([first.life.energySpent, first.life.restsThisYear, first.life.stats.stress]).toEqual([2, 1, 32])
    expect(first.entry.changes).toContainEqual({ key: 'energy', delta: 3 })
    const second = finishActivity(first.life, act('sleep-in'), GOOD_SCORE)
    expect([second.life.energySpent, second.life.stats.stress]).toEqual([0, 30])
    expect(finishActivity(testLife(), act('sleep-in'), GOOD_SCORE).entry.text).toMatch(/already rested\.$/)
  })
  it('scales earnings and keeps prices fixed', () => {
    const pay = (score: number) => finishActivity(testLife(), act('warung-shift'), score).life.money - 215000
    expect([pay(0.9), pay(0.6), pay(0.3), pay(0.1)]).toEqual([90000, 60000, 30000, 0])
  })
  it('says why an activity is closed, and why one is open', () => {
    expect(offer(testLife(), 'bimbel').blocked).toBe('You need Rp 250.000. You have Rp 215.000.')
    expect(offer(testLife(), 'motorbike').blocked).toBe('From age 17, with a SIM C licence')
    expect(offer(testLife({ age: 17 }), 'motorbike').blocked).toBe('You need Rp 4.500.000. You have Rp 215.000.')
    expect(offer(testLife(), 'osis')).toMatchObject({ blocked: null, openNote: 'Open to you: Reputation 60+' })
    expect(offer(testLife({ stats: { ...testLife().stats, reputation: 40 } }), 'osis').blocked).toContain('Reputation 60')
    expect(offer(testLife({ energySpent: 9 }), 'gym').overwork).toBe(true)
    expect(offer(testLife({ energySpent: 5, restsThisYear: 1 }), 'sleep-in').energyGain).toBe(2)
    expect(() => finishActivity(testLife(), act('bimbel'), 0.9)).toThrow(/You need/)
  })
  it('records only the changes that really happened', () => {
    const at = (stats: Partial<Life['stats']>) => finishActivity(testLife({ stats: { ...testLife().stats, ...stats } }), act('jog'), 0.6).entry.changes.map((c) => c.key)
    expect(at({ stress: 0 })).not.toContain('stress')
    expect(at({ health: 100 })).not.toContain('health')
    expect(at({})).toEqual(['health', 'stress'])
  })
  it('never words a fail as a success', () => {
    expect(finishActivity(testLife(), act('study-exam'), 0.1).entry.text).toBe('Study for the exam: it did not go well this time.')
  })

  it('makes a new friend on a good result, named in the journal', () => {
    const made = finishActivity(testLife(), act('new-friend'), 0.9)
    const friend = made.life.people.at(-1)!
    expect(friend).toMatchObject({ id: 'p-4', relation: 'friend', gender: 'male', age: 16, closeness: 40 })
    expect(testLife().people.some((p) => p.name === friend.name)).toBe(false)
    expect(made.entry.text).toBe(`You made a new friend: ${friend.name}.`)
    expect(made.life.rng).not.toBe(testLife().rng)
    for (const score of [0.1, 0.3]) expect(finishActivity(testLife(), act('new-friend'), score).life.people).toHaveLength(3)
  })
  it('cooks with your mother and calls a grandmother first', () => {
    const cooked = finishActivity(testLife(), act('cook'), 0.6)
    expect(cooked.life.people[0]!.closeness).toBe(74)
    expect(cooked.life.spentWith).toEqual(['p-1'])
    expect(cooked.entry.people).toEqual([{ id: 'p-1', delta: 4 }])
    expect(finishActivity(testLife(), act('cook'), 0.1).life.people[0]!.closeness).toBe(68)
    expect(offer(testLife({ people: testLife().people.slice(1) }), 'cook').blocked).toBe('You have no mother.')
    expect(offer(testLife(), 'call-nenek').blocked).toBe('You have no grandparents.')
    const grand = (id: string, gender: 'female' | 'male') => ({ id, name: id, relation: 'grandparent' as const, gender, age: 70, closeness: 50 })
    const called = finishActivity(testLife({ people: [grand('p-8', 'male'), grand('p-9', 'female')] }), act('call-nenek'), GOOD_SCORE)
    expect(called.entry.people).toEqual([{ id: 'p-9', delta: 4 }])
    expect(called.life.spentWith).toEqual(['p-9'])
  })
  it('brings the family to dinner', () => {
    const sis = { id: 'p-4', name: 'Rina', relation: 'sibling' as const, gender: 'female' as const, age: 12, closeness: 50 }
    const ate = finishActivity(testLife({ people: [...testLife().people, sis] }), act('family-dinner'), GOOD_SCORE)
    expect(ate.entry.people).toEqual([{ id: 'p-1', delta: 2 }, { id: 'p-2', delta: 2 }, { id: 'p-4', delta: 2 }])
    expect(ate.life.spentWith).toEqual(['p-1', 'p-2', 'p-4'])
    expect(ate.life.people[2]!.closeness).toBe(60) // a friend is not family
  })
})
