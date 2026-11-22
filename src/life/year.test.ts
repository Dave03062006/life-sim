import { describe, expect, it } from 'vitest'
import { packFor } from '../content'
import { testLife } from './testLife'
import { ageUp, closeYear, newLife } from './year'

describe('year', () => {
  it('rolls the same life from the same seed, inside the starting ranges', () => {
    expect(newLife({ seed: 7 })).toEqual(newLife({ seed: 7 }))
    for (let seed = 1; seed <= 200; seed++) {
      const s = newLife({ seed }).stats
      expect(s.health >= 60 && s.health <= 100 && s.happiness >= 50 && s.happiness <= 90).toBe(true)
      expect(s.smarts >= 20 && s.smarts <= 90 && s.looks >= 20 && s.looks <= 90 && s.stress >= 0 && s.stress <= 20).toBe(true)
      expect(s.reputation).toBe(50)
    }
    expect(newLife({ seed: 7, startAge: 15 }).age).toBe(15)
    expect(newLife({ seed: 7 }).age).toBe(0)
  })

  it('starts a version 3 life with wealth, no death, and money only from age 15', () => {
    expect(newLife({ seed: 7, wealth: 'comfortable' })).toMatchObject({ version: 5, wealth: 'comfortable', death: null, money: 0 })
    expect(newLife({ seed: 7, startAge: 15 }).money).toBe(200000)
  })

  it('gives a new life a family, and a friend from age 12', () => {
    const young = newLife({ seed: 7 }).people
    expect(young.map((p) => p.relation)).toEqual(expect.arrayContaining(['mother', 'father']))
    expect(young.some((p) => p.relation === 'friend')).toBe(false)
    const teen = newLife({ seed: 7, startAge: 15, gender: 'female' }).people
    expect(teen.at(-1)).toMatchObject({ relation: 'friend', gender: 'female', age: 15 })
    expect(newLife({ seed: 7, startAge: 15 }).stats).toEqual(newLife({ seed: 7 }).stats)
  })

  it('ages up with the yearly changes and a clean year', () => {
    const pack = packFor('indonesia')
    const next = ageUp(testLife({ energySpent: 7, restsThisYear: 2, doneThisYear: { jog: 1 }, school: { ...testLife().school, at: null } }), pack)
    expect([next.age, next.stats.stress, next.stats.happiness, next.stats.reputation]).toEqual([17, 25, 69, 61])
    expect([next.energySpent, next.restsThisYear, next.doneThisYear]).toEqual([0, 0, {}])
    expect(next.journal.at(-1)).toMatchObject({ age: 17, kind: 'milestone' })
    expect(next.journal.at(-1)?.text).toContain('KTP')
  })

  it('closes the school year before the death check, so a dying life gets its last report card', () => {
    const pack = packFor('indonesia')
    const life = testLife({ stats: { ...testLife().stats, health: 0 }, energySpent: 5 })
    const next = ageUp(life, pack)
    expect(next.death).toEqual({ age: 16, cause: 'Health gave out' })
    expect(next.age).toBe(16)
    expect(next.journal.map((j) => j.text)).toEqual(['This year: allowance Rp 1.200.000.', expect.stringContaining('Your report card'), 'You died at 16. Health gave out.'])
    expect(closeYear(life, pack).journal).toHaveLength(2)
  })

  it('wears the body down with age', () => {
    const pack = packFor('indonesia')
    const base = testLife().stats
    expect(ageUp(testLife({ age: 44 }), pack).stats.health).toBe(base.health - 1)
    expect(ageUp(testLife({ age: 64 }), pack).stats.health).toBe(base.health - 2)
    expect(ageUp(testLife({ age: 39 }), pack).stats.looks).toBe(base.looks - 1)
    expect(ageUp(testLife({ age: 20 }), pack).stats.looks).toBe(base.looks)
  })
  it('lets you choose a lifestyle during the year you turn 25', () => {
    const life = ageUp(testLife({ age: 24, ownWay: false }), packFor('indonesia'))
    expect([life.age, life.ownWay]).toEqual([25, true])
  })
})
