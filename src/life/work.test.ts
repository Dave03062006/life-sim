import { describe, expect, it } from 'vitest'
import { packFor } from '../content'
import { resolveEvent } from './events'
import { closeYear, ageUp } from './year'
import { salaryOf, closeWorkYear, jobBoard, jobLabel, currentStep } from './work'
import { findMove, takePath } from './path'
import { finishActivity } from './activities'
import { testLife } from './testLife'
import type { Job, Life } from './types'

const pack = packFor('indonesia')
const grown = { age: 22, school: { ...testLife().school, at: null, done: ['tk', 'sd', 'smp', 'sma'] as Life['school']['done'] } }
const working = (job: Partial<Job> = {}, more: Partial<Life> = {}) =>
  testLife({ ...grown, job: { careerId: 'office', step: 0, performance: 50, years: 0, ...job }, ...more })

describe('work', () => {
  it('names the job and finds the step', () => {
    expect(jobLabel(working())).toBe('Office clerk')
    expect(jobLabel(testLife())).toBeNull()
    expect(currentStep(working())?.step.salary).toBe(48_000_000)
  })

  it('queues the promotion for a good clerk, and accepting moves up', () => {
    const closed = closeWorkYear(working({ performance: 90, years: 1 }), pack) // drifts to 80, years 2
    expect(closed.pendingEvents).toEqual([{ eventId: 'promotion', cast: {} }])
    const done = resolveEvent(closed, pack, 'accept', 'calm').life
    expect(done.job).toEqual({ careerId: 'office', step: 1, performance: 50, years: 0 })
    expect(done.journal.at(-1)?.text).toBe('You were promoted to Admin officer.')
  })

  it('does not offer a promotion before two years, or the top step without Reputation 60', () => {
    expect(closeWorkYear(working({ performance: 90, years: 0 }), pack).pendingEvents).toEqual([])
    const top = working({ step: 2, performance: 90, years: 5 }, { stats: { ...testLife().stats, reputation: 59 } })
    expect(closeWorkYear(top, pack).pendingEvents).toEqual([])
    expect(findMove(top, 'promote', pack)?.blocked).toBe('Needs Reputation 60 or more.')
  })

  it('pays the raise bonus on a successful ask', () => {
    const queued = { ...working({ performance: 80, years: 2 }), pendingEvents: [{ eventId: 'promotion', cast: {} }] }
    const results = Array.from({ length: 40 }, (_, rng) => resolveEvent({ ...queued, rng }, pack, 'raise', 'calm'))
    const win = results.find((r) => r.tier === 'success')!
    expect(win.life.money - queued.money).toBe(6_600_000)
    expect(win.life.job?.step).toBe(1)
    expect(results.find((r) => r.tier === 'fail')!.life.job?.step).toBe(0)
  })

  it('lets you go below 20, with the memory', () => {
    const out = closeWorkYear(working({ performance: 25 }), pack) // drifts to 15
    expect(out.job).toBeNull()
    expect(out.journal.at(-1)?.text).toBe('You were let go from your job as Office clerk.')
    expect(out.memories.map((m) => m.id)).toContain('let-go')
  })

  it('pays a business by its performance', () => {
    const shop = (performance: number) => working({ careerId: 'business', performance })
    expect(salaryOf(shop(50), pack)).toBe(30_000_000)
    expect(salaryOf(shop(0), pack)).toBe(12_000_000)
    expect(salaryOf(working(), pack)).toBe(48_000_000)
    expect(salaryOf(testLife(), pack)).toBe(0)
  })

  it('adds the salary in closeYear', () => {
    const life = working()
    const closed = closeYear(life, pack)
    expect(closed.money - life.money).toBe(48_000_000)
    expect(closed.journal.at(-1)?.changes).toEqual([{ key: 'money', delta: 48_000_000 }])
    expect(ageUp(life, pack).job?.years).toBe(1)
  })

  it('applies, replaces, quits and retires', () => {
    expect(jobBoard(testLife(), pack)).toHaveLength(8)
    const start = takePath(testLife(grown), 'job:office', pack)
    expect(start.job).toEqual({ careerId: 'office', step: 0, performance: 50, years: 0 })
    expect(start.ownWay).toBe(true)
    const swapped = takePath({ ...start, money: 20_000_000 }, 'job:business', pack)
    expect(swapped.money).toBe(10_000_000)
    expect(swapped.journal.map((e) => e.text)).toContain('You left your job as Office clerk.')
    expect(takePath(start, 'quit', pack).job).toBeNull()
    expect(takePath(working({}, { age: 60 }), 'retire', pack).journal.at(-1)?.text).toBe('You retired from your job as Office clerk.')
    expect(findMove(testLife({ ...grown, money: 5 }), 'job:business', pack)?.blocked).toBe('You need Rp 10.000.000. You have Rp 5.')
  })

  it('scales performance from work activities, and slacking always costs', () => {
    const def = (id: string) => pack.activities.find((a) => a.id === id)!
    expect(finishActivity(working(), def('extra-hours'), 0.7).life.job?.performance).toBe(58)
    expect(finishActivity(working(), def('extra-hours'), 0.1).life.job?.performance).toBe(50)
    expect(finishActivity(working(), def('slack-off'), 0.1).life.job?.performance).toBe(45)
  })
})
