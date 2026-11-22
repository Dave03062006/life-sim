import { describe, expect, it } from 'vitest'
import { packFor } from '../content'
import { LENGTH, SCHOLARSHIP, UNI_FEE, closeSchoolYear, reportCard, schoolLabel } from './school'
import { schoolForAge } from './requirements'
import { testLife } from './testLife'
import { ageUp, newLife } from './year'

const pack = packFor('indonesia')
const school = (over: Partial<ReturnType<typeof testLife>['school']>) => ({ ...testLife().school, ...over })

describe('school', () => {
  it('enrols at TK, SD and SMP in turn and queues the SMP fork at 15', () => {
    let life = newLife({ seed: 3 })
    const seen: Record<number, string | null> = {}
    while (life.age < 15) {
      life = ageUp({ ...life, stats: { ...life.stats, health: 100 } }, pack)
      seen[life.age] = life.school.at
    }
    expect([seen[3], seen[4], seen[5], seen[6], seen[11], seen[12], seen[14], seen[15]]).toEqual([null, 'tk', 'tk', 'sd', 'sd', 'smp', 'smp', null])
    expect(life.school.done).toEqual(['tk', 'sd', 'smp'])
    expect(life.pendingEvents.map((p) => p.eventId)).toContain('after-smp')
    expect(life.journal.some((j) => j.text.startsWith('You started TK.'))).toBe(true)
    expect(life.journal.some((j) => j.text === 'You finished SMP.')).toBe(true)
  })

  it('enrols a child who skipped TK at SD at 6', () => {
    const life = ageUp(testLife({ age: 5, school: schoolForAge(3), stats: { ...testLife().stats, health: 100 } }), pack)
    expect(life.school.at).toBe('sd')
  })

  it('computes the report card from Smarts and effort', () => {
    const stats = { ...testLife().stats, smarts: 100 }
    expect(reportCard(testLife({ stats, school: school({ effort: 0 }) }))).toBe(60)
    expect(reportCard(testLife({ stats, school: school({ effort: 3 }) }))).toBe(100)
    expect(reportCard(testLife({ stats, school: school({ effort: 9 }) }))).toBe(100)
  })

  it('writes the report card and its effects', () => {
    const high = closeSchoolYear(testLife({ stats: { ...testLife().stats, smarts: 100 }, school: school({ effort: 3 }) }))
    expect(high.journal[0]?.text).toBe('Your report card: 100.')
    expect(high.stats.happiness).toBe(74)
    expect(high.school).toMatchObject({ year: 2, effort: 0, grade: 100 })
    const low = closeSchoolYear(testLife({ stats: { ...testLife().stats, smarts: 20 } }))
    expect([low.stats.happiness, low.stats.stress]).toEqual([68, 38])
  })

  it('gives no report card at TK', () => {
    const life = closeSchoolYear(testLife({ age: 4, school: school({ at: 'tk', year: 0, done: [] }) }))
    expect(life.journal).toEqual([])
    expect(life.school.year).toBe(1)
  })

  it('finishes a level when the years are done', () => {
    const life = closeSchoolYear(testLife({ school: school({ at: 'sma', year: LENGTH.sma - 1 }) }))
    expect(life.school).toMatchObject({ at: null, done: ['tk', 'sd', 'smp', 'sma'] })
    expect(life.journal.at(-1)?.text).toBe('You finished SMA.')
  })

  it('takes the fee each year of self-funded uni and graduates after four', () => {
    let life = testLife({ age: 19, money: 50_000_000, school: school({ at: 'uni', year: 0, done: ['tk', 'sd', 'smp', 'sma'], field: 'business', funding: 'self' }) })
    for (let i = 0; i < 4; i++) life = closeSchoolYear(life)
    expect(life.money).toBe(50_000_000 - 4 * UNI_FEE)
    expect(life.school).toMatchObject({ at: null, funding: null, field: 'business' })
    expect(life.school.done.at(-1)).toBe('uni')
    expect(life.journal.some((j) => j.text === 'You graduated in business.')).toBe(true)
  })

  it('takes nothing from a scholarship', () => {
    const life = closeSchoolYear(testLife({ age: 19, school: school({ at: 'uni', year: 0, field: 'arts', funding: 'scholarship' }) }))
    expect(life.money).toBe(testLife().money)
    expect(SCHOLARSHIP).toEqual({ smarts: 80, grade: 80 })
  })

  it('labels where you are', () => {
    expect(schoolLabel(testLife())).toBe('SMA, year 2')
    expect(schoolLabel(testLife({ school: school({ at: 'uni', year: 0, field: 'business' }) }))).toBe('University, business, year 1')
    expect(schoolLabel(testLife({ school: school({ at: null }) }))).toBeNull()
  })
})
