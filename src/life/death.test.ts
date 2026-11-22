import { describe, expect, it } from 'vitest'
import type { ContentPack, IllnessDef } from '../content/types'
import { createRng } from '../engine/random'
import { CAUSE, deathCause, oldAgeChance } from './death'
import { peopleDeaths } from './people'
import { testLife } from './testLife'
import type { Person } from './types'

const sri: Person = { id: 'p-4', name: 'Sri', relation: 'grandparent', gender: 'female', age: 84, closeness: 60 }

describe('death', () => {
  it('gives old age odds by decade, scaled by health', () => {
    expect(oldAgeChance(59, 50)).toBe(0)
    expect([oldAgeChance(75, 50), oldAgeChance(75, 85), oldAgeChance(75, 20)]).toEqual([0.04, 0.02, 0.08])
    expect([oldAgeChance(60, null), oldAgeChance(84, null), oldAgeChance(95, null)]).toEqual([0.01, 0.12, 0.3])
  })

  it('makes old age likelier from 100 and certain from 115', () => {
    expect([oldAgeChance(100, 50), oldAgeChance(100, 85), oldAgeChance(115, 90), oldAgeChance(120, null)]).toEqual([0.6, 0.3, 1, 1])
  })

  it('always ends a life at Health 0', () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(deathCause(testLife({ age: 30, stats: { ...testLife().stats, health: 0 } }), createRng(seed))).toBe(CAUSE.health)
    }
  })

  it('lets a young healthy life go on', () => {
    expect(deathCause(testLife(), createRng(1))).toBeNull()
  })

  it('takes a grandparent whose first draw lands below their chance', () => {
    const life = testLife({ age: 30, people: [sri] })
    // seed 7's first draw is 0.012, under Sri's 0.12 at 84; seed 1's is 0.627
    const after = peopleDeaths(life, createRng(7))
    expect(after.people).toEqual([])
    expect(after.journal.at(-1)).toMatchObject({ age: 30, text: 'Your grandmother Sri died, aged 84.' })
    expect(after.memories).toEqual([{ id: 'death-p-4', age: 30, text: 'Your grandmother Sri died, aged 84.', people: ['p-4'] }])
    expect(peopleDeaths(life, createRng(1)).people).toEqual([sri])
  })

  it('names the relation by gender', () => {
    const word = (relation: Person['relation'], gender: Person['gender']) =>
      peopleDeaths(testLife({ people: [{ ...sri, relation, gender, age: 95 }] }), createRng(7)).journal.at(-1)?.text
    expect(word('sibling', 'male')).toBe('Your brother Sri died, aged 95.')
    expect(word('sibling', 'female')).toBe('Your sister Sri died, aged 95.')
    expect(word('grandparent', 'male')).toBe('Your grandfather Sri died, aged 95.')
    expect(word('crush', 'female')).toBe('Your crush Sri died, aged 95.')
    expect(word('father', 'male')).toBe('Your father Sri died, aged 95.')
  })

  it('checks Health 0 first, then illness, then old age', () => {
    const flu: IllnessDef = { id: 'test-flu', name: 'Flu', kind: 'short', onset: [], symptoms: '', stages: [{ death: 0 }], untreated: { die: [[0, 1]] }, treated: { die: 0 }, treatments: [], sources: [] }
    const pack: ContentPack = { id: 'indonesia', activities: [], milestones: {}, events: [], careers: [], belongings: [], illnesses: [flu] }
    const sick = { id: 'test-flu', since: 1, stage: 0, known: true, treated: null }
    const stats = testLife().stats
    expect(deathCause(testLife({ age: 99, illnesses: [sick], stats: { ...stats, health: 0 } }), createRng(1), pack)).toBe(CAUSE.health)
    expect(deathCause(testLife({ age: 116, illnesses: [sick] }), createRng(1), pack)).toBe('Flu')
    expect(deathCause(testLife({ age: 116, illnesses: [{ ...sick, treated: 'cured' }] }), createRng(1), pack)).toBe(CAUSE.oldAge)
    expect(deathCause(testLife({ age: 116 }), createRng(1), pack)).toBe(CAUSE.oldAge)
  })
})
