import { describe, expect, it } from 'vitest'
import type { Requirement } from '../content/types'
import { blockedBy, finished } from './requirements'
import { testLife } from './testLife'

const school = (levels: ('sma' | 'uni')[]): Requirement => ({ kind: 'school', levels, reason: 'school' })

describe('blockedBy', () => {
  it('is null for no requirements', () => expect(blockedBy(testLife(), [])).toBeNull())
  it('blocks max-age above the limit only', () => {
    const r: Requirement = { kind: 'max-age', age: 35, reason: 'too old' }
    expect(blockedBy(testLife({ age: 35 }), [r])).toBeNull()
    expect(blockedBy(testLife({ age: 36 }), [r])).toBe('too old')
  })
  it('blocks min-age', () => expect(blockedBy(testLife({ age: 10 }), [{ kind: 'min-age', age: 15, reason: 'young' }])).toBe('young'))
  it('school passes while enrolled or after finishing', () => {
    const base = testLife().school
    expect(blockedBy(testLife(), [school(['uni'])])).toBe('school')
    expect(blockedBy(testLife({ school: { ...base, at: 'sma' } }), [school(['sma'])])).toBeNull()
    expect(blockedBy(testLife({ school: { ...base, done: ['sma'] } }), [school(['sma'])])).toBeNull()
    expect(finished(testLife({ school: { ...base, done: ['sd'] } }), 'tk', 'sd')).toBe(true)
    expect(finished(testLife(), 'uni')).toBe(false)
  })
  it('field needs finished uni in that field', () => {
    const base = testLife().school
    const r: Requirement = { kind: 'field', field: 'health', reason: 'field' }
    expect(blockedBy(testLife({ school: { ...base, field: 'health' } }), [r])).toBe('field')
    expect(blockedBy(testLife({ school: { ...base, done: ['uni'], field: 'arts' } }), [r])).toBe('field')
    expect(blockedBy(testLife({ school: { ...base, done: ['uni'], field: 'health' } }), [r])).toBeNull()
  })
  it('flag, no-flag, owns and job', () => {
    expect(blockedBy(testLife(), [{ kind: 'flag', flag: 'bank', reason: 'f' }])).toBe('f')
    expect(blockedBy(testLife({ flags: ['bank'] }), [{ kind: 'flag', flag: 'bank', reason: 'f' }])).toBeNull()
    expect(blockedBy(testLife({ flags: ['bank'] }), [{ kind: 'no-flag', flag: 'bank', reason: 'n' }])).toBe('n')
    expect(blockedBy(testLife(), [{ kind: 'no-flag', flag: 'bank', reason: 'n' }])).toBeNull()
    expect(blockedBy(testLife(), [{ kind: 'owns', item: 'bike', reason: 'o' }])).toBe('o')
    expect(blockedBy(testLife({ belongings: ['bike'] }), [{ kind: 'owns', item: 'bike', reason: 'o' }])).toBeNull()
    expect(blockedBy(testLife(), [{ kind: 'job', reason: 'j' }])).toBe('j')
    expect(blockedBy(testLife({ job: { careerId: 'x', step: 0, performance: 50, years: 0 } }), [{ kind: 'job', reason: 'j' }])).toBeNull()
  })
  it('ignores stat requirements and reports the first unmet reason', () => {
    const stat: Requirement = { kind: 'stat', key: 'smarts', min: 100, reason: 's', openNote: '' }
    expect(blockedBy(testLife(), [stat])).toBeNull()
    expect(blockedBy(testLife(), [stat, { kind: 'flag', flag: 'a', reason: 'a' }, { kind: 'flag', flag: 'b', reason: 'b' }])).toBe('a')
  })
})
