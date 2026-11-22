import { describe, expect, it } from 'vitest'
import { packFor } from '../content'
import { resolveEvent } from './events'
import { blockedBy } from './requirements'
import { closeSchoolYear } from './school'
import { findMove, pathActions, takePath } from './path'
import { testLife } from './testLife'

const pack = packFor('indonesia')
const school = (over: Partial<ReturnType<typeof testLife>['school']>) => ({ ...testLife().school, ...over })
const move = (life: ReturnType<typeof testLife>, id: string) => findMove(life, id, pack)!

describe('work moves', () => {
  const adult = (over: Partial<ReturnType<typeof testLife>> = {}) => testLife({ age: 30, school: school({ at: null, done: ['tk', 'sd', 'smp', 'sma'] }), ...over })
  it('blocks software below Smarts 70, with the reason', () => {
    expect(move(adult({ stats: { ...testLife().stats, smarts: 65 } }), 'job:software').blocked).toBe('Needs Smarts 70 or more.')
    expect(move(adult({ stats: { ...testLife().stats, smarts: 70 } }), 'job:software').blocked).toBeNull()
  })
  it('blocks the civil service test after 35', () => {
    expect(move(adult({ age: 36 }), 'job:civil').blocked).toBe('The civil service test is open up to age 35.')
  })
  it('blocks full-time work while in school', () => {
    expect(move(testLife({ age: 16 }), 'job:office').blocked).toBe('Finish or leave school first.')
    expect(move(testLife({ age: 16 }), 'job:shop').blocked).toBeNull()
  })
  it('needs a motorbike for driving and a degree for teaching', () => {
    expect(move(adult(), 'job:driving').blocked).toBe('You need a motorbike.')
    expect(move(adult({ belongings: ['motorbike'] }), 'job:driving').blocked).toBeNull()
    expect(move(adult(), 'job:teaching').blocked).toBe('Needs a degree in education.')
  })
  it('keeps retire closed until 58', () => {
    expect(move(testLife({ age: 57 }), 'retire').blocked).toBe('You can retire from 58.')
    expect(move(testLife({ age: 58 }), 'retire').blocked).toBe("You don't have a job.")
    expect(move(testLife({ age: 30 }), 'quit').blocked).toBe("You don't have a job.")
  })
})

describe('path', () => {
  it('blocks leave-school until SMP is finished, and opens it in SMA', () => {
    const smp = testLife({ age: 13, school: school({ at: 'smp', year: 1, done: ['tk', 'sd'] }) })
    expect(move(smp, 'leave-school').blocked).toBe('You can leave school once SMP is finished.')
    expect(move(testLife(), 'leave-school').blocked).toBeNull()
    const left = takePath(testLife(), 'leave-school', pack)
    expect(left.school.at).toBeNull()
    expect(left.journal.at(-1)?.text).toBe('You left school.')
  })

  it('opens SMA and SMK after SMP, not while enrolled', () => {
    const after = testLife({ age: 15, school: school({ at: null, year: 0, done: ['tk', 'sd', 'smp'] }) })
    expect(move(after, 'sma').blocked).toBeNull()
    expect(move(testLife(), 'smk').blocked).not.toBeNull()
    expect(takePath(after, 'smk', pack).school).toMatchObject({ at: 'smk', year: 0 })
  })

  it('blocks the five uni moves until the entrance test is passed', () => {
    const grad = testLife({ age: 19, school: school({ at: null, year: 0, done: ['tk', 'sd', 'smp', 'sma'] }) })
    const unis = pathActions(grad, pack).filter((a) => a.id.startsWith('uni:'))
    expect(unis).toHaveLength(5)
    expect(unis.map((a) => a.blocked)).toEqual(Array(5).fill('Pass the entrance test first.'))
    expect(move({ ...grad, flags: ['passed-entrance'] }, 'uni:business').blocked).toBeNull()
  })

  it('opens Paket C at 18 for a life that left after SMP', () => {
    const left = testLife({ age: 18, school: school({ at: null, year: 0, done: ['tk', 'sd', 'smp'] }) })
    expect(move(left, 'paket-c').blocked).toBeNull()
    expect(move({ ...left, age: 17 }, 'paket-c').blocked).not.toBeNull()
    expect(takePath(left, 'paket-c', pack).school.at).toBe('paket-c')
  })

  it('decides funding at enrolment and says so', () => {
    const grad = testLife({ age: 19, flags: ['passed-entrance'], school: school({ at: null, year: 0, grade: 85, done: ['tk', 'sd', 'smp', 'sma'] }) })
    const smart = { ...grad, stats: { ...grad.stats, smarts: 85 } }
    expect(move(smart, 'uni:health').detail).toBe('Scholarship: no fees.')
    expect(move({ ...grad, wealth: 'well-off' }, 'uni:health').detail).toBe('Your family pays.')
    expect(move(grad, 'uni:health').detail).toBe('Rp 10.000.000 a year.')
    const started = takePath(smart, 'uni:business', pack)
    expect(started.school).toMatchObject({ at: 'uni', field: 'business', funding: 'scholarship', year: 0 })
    expect(started.journal.at(-1)?.text).toBe('You started university: business. You won a scholarship.')
    expect(takePath(started, 'leave-uni', pack).school.at).toBeNull()
  })

  it('keeps a finished degree when studying another field', () => {
    const grad = testLife({ age: 25, flags: ['passed-entrance'], school: school({ at: null, year: 0, done: ['tk', 'sd', 'smp', 'sma', 'uni'], degrees: ['education'] }) })
    expect(move(grad, 'uni:education').blocked).toBe('You already have this degree.')
    const left = takePath(takePath(grad, 'uni:health', pack), 'leave-uni', pack)
    expect(blockedBy(left, [{ kind: 'field', field: 'education', reason: 'x' }])).toBeNull()
    let two = takePath(grad, 'uni:health', pack)
    for (let i = 0; i < 4; i++) two = closeSchoolYear(two)
    expect(two.school.degrees).toEqual(['education', 'health'])
  })

  it('throws on a blocked or unknown move', () => {
    expect(() => takePath(testLife(), 'paket-c', pack)).toThrow('paket-c is blocked')
    expect(() => takePath(testLife(), 'nope', pack)).toThrow('Unknown')
  })

  it('takes the path an event outcome carries, and skips a blocked one', () => {
    const fork = { pendingEvents: [{ eventId: 'after-smp', cast: {} }], school: school({ at: null, year: 0, done: ['tk', 'sd', 'smp'] }) }
    expect(resolveEvent(testLife(fork), pack, 'smk', 'calm').life.school.at).toBe('smk')
    const left = resolveEvent(testLife({ ...fork, school: school({ at: null, year: 0, done: ['tk', 'sd', 'smp'] }) }), pack, 'work', 'calm').life
    expect(left.school.at).toBeNull()
    expect(left.journal.filter((j) => j.text === 'You left school.')).toEqual([])
  })
})
