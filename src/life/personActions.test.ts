import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EventDef } from '../content/types'
import { finishActivity } from './activities'
import { actionsFor, afterEvent, GIFT_PRICE, giveGift, talk, timeActivity } from './personActions'
import { testLife } from './testLife'
import type { Life, Person } from './types'

const events = vi.hoisted(() => [] as EventDef[])
vi.mock('../content', async (orig) => {
  const real = await orig<typeof import('../content')>()
  return { packFor: (country: 'indonesia') => ({ ...real.packFor(country), events }) }
})
const builtIn = (id: string): EventDef => ({
  id, kind: 'choice', stages: ['late-teen'], weight: 0, title: id, text: id, cast: { them: 'friend' },
  actions: [{ id: 'a', label: 'Go', chance: 100, outcomes: { success: { text: 'ok' }, mixed: { text: 'ok' }, fail: { text: 'ok' } } }],
})
const ayu: Person = { id: 'p-4', name: 'Ayu', relation: 'crush', gender: 'female', age: 16, closeness: 50 }
const blockedOf = (life = testLife(), id = 'p-3') => Object.fromEntries(actionsFor(life, id).map((a) => [a.id, a.blocked]))

beforeEach(() => events.splice(0, events.length, builtIn('talk'), builtIn('ask-out'), builtIn('propose')))

describe('person actions', () => {
  it('offers time, talk and a gift to everyone, and asking out only to a crush', () => {
    expect(actionsFor(testLife(), 'p-3').map((a) => a.id)).toEqual(['time', 'talk', 'gift'])
    expect(blockedOf()).toEqual({ time: null, talk: null, gift: null })
    const life = testLife({ people: [...testLife().people, ayu] })
    expect(actionsFor(life, 'p-4').map((a) => a.id)).toEqual(['time', 'talk', 'gift', 'ask-out'])
    expect(actionsFor(life, 'p-4').every((a) => a.label !== '' && a.detail !== '')).toBe(true)
    expect(actionsFor(life, 'p-9')).toEqual([])
  })
  it('blocks talking and asking out until the events exist', () => {
    events.length = 0
    const life = testLife({ people: [...testLife().people, ayu] })
    expect(blockedOf(life, 'p-4')).toEqual({ time: null, talk: 'Not available yet.', gift: null, 'ask-out': 'Not available yet.' })
  })
  it('lets you ask out a close crush from 15', () => {
    const withAyu = (closeness: number, age = 16) => testLife({ age, people: [...testLife().people, { ...ayu, closeness }] })
    expect(blockedOf(withAyu(50), 'p-4')['ask-out']).toBeNull()
    expect(blockedOf(withAyu(49), 'p-4')['ask-out']).toBe('You are not close enough yet.')
    expect(blockedOf(withAyu(80, 14), 'p-4')['ask-out']).toBe('You need to be 15.')
    expect(blockedOf({ ...withAyu(80), interest: 'none' }, 'p-4')['ask-out']).toBe('You are not looking for romance.')
    expect(blockedOf({ ...withAyu(80), interest: 'men' }, 'p-4')['ask-out']).toBeNull()
    const partner: Person = { ...ayu, id: 'p-5', name: 'Rafi', relation: 'partner' }
    expect(blockedOf(testLife({ people: [...withAyu(80).people, partner] }), 'p-4')['ask-out']).toBe('You already have a partner.')
  })
  it('gives a gift only when you can pay', () => {
    expect(blockedOf(testLife({ money: 40000 })).gift).toBe('You need Rp 50.000. You have Rp 40.000.')
    const { life, entry } = giveGift(testLife(), 'p-3')
    expect(life.money).toBe(215000 - GIFT_PRICE)
    expect(life.people.find((p) => p.id === 'p-3')!.closeness).toBe(70)
    expect(entry).toEqual({ age: 16, kind: 'activity', text: 'You gave Dimas a gift.', changes: [{ key: 'money', delta: -GIFT_PRICE }], people: [{ id: 'p-3', delta: 10 }] })
    expect(life.journal.at(-1)).toEqual(entry)
    expect(life.spentWith).toEqual(['p-3'])
    expect(() => giveGift(testLife({ money: 40000 }), 'p-3')).toThrow(/need Rp 50\.000/)
  })
  it('picks a mini-game suited to the relation', () => {
    const games = (['mother', 'father', 'sibling', 'grandparent', 'friend', 'crush', 'partner'] as const).map((relation) =>
      timeActivity({ ...ayu, relation }).minigame)
    expect(games).toEqual([
      { type: 'catch', theme: 'cook' }, { type: 'catch', theme: 'cook' }, { type: 'tapping', theme: 'time' },
      { type: 'memory', theme: 'chess' }, { type: 'tapping', theme: 'time' }, { type: 'tapping', theme: 'time' }, { type: 'timing', theme: 'time' },
    ])
    expect(timeActivity(ayu)).toMatchObject({ id: 'time:p-4', category: 'people', energy: 1, effects: { happiness: 3 } })
  })
  it('brings you closer by how well the time went', () => {
    const dimas = testLife().people[2]!
    const done = (score: number, life = testLife()) => finishActivity(life, timeActivity(dimas), score, 'p-3')
    const great = done(0.9)
    expect(great.life.people[2]!.closeness).toBe(72)
    expect(great.life.spentWith).toEqual(['p-3'])
    expect(great.entry.people).toEqual([{ id: 'p-3', delta: 12 }])
    expect(done(0.6).life.people[2]!.closeness).toBe(68)
    expect(done(0.1).life.people[2]!.closeness).toBe(57)
    expect(done(0.6, testLife({ spentWith: ['p-3'] })).life.spentWith).toEqual(['p-3'])
    expect(finishActivity(testLife(), timeActivity(dimas), 0.9).entry.people).toBeUndefined()
  })
  it('turns a crush into a partner when asking out succeeds', () => {
    const life = testLife({ people: [...testLife().people, ayu] })
    expect(afterEvent(life, 'ask-out', { them: 'p-4' }, 'success').people[3]!.relation).toBe('partner')
    expect(afterEvent(life, 'ask-out', { them: 'p-4' }, 'mixed')).toBe(life)
    expect(afterEvent(life, 'talk', { them: 'p-4' }, 'success')).toBe(life)
  })
  it('sets since on a new partner and blocks asking out while married', () => {
    const life = testLife({ age: 17, people: [...testLife().people, ayu] })
    expect(afterEvent(life, 'ask-out', { them: 'p-4' }, 'success').people[3]).toMatchObject({ relation: 'partner', since: 17 })
    const wed = testLife({ interest: 'women', people: [...life.people, { ...ayu, id: 'p-5', relation: 'spouse' }] })
    expect(blockedOf(wed, 'p-4')['ask-out']).toBe('You are married.')
  })
  it('lets you propose to a partner, giving the reasons in order', () => {
    const rani: Person = { id: 'p-5', name: 'Rani', relation: 'partner', gender: 'female', age: 25, closeness: 80, since: 18 }
    const withRani = (over: Partial<Life>, partner: Partial<Person> = {}) => testLife({ age: 22, people: [...testLife().people, { ...rani, ...partner }], ...over })
    expect(actionsFor(withRani({}), 'p-5').map((a) => a.id)).toEqual(['time', 'talk', 'gift', 'propose'])
    expect(blockedOf(withRani({}), 'p-5').propose).toBeNull()
    expect(blockedOf(withRani({ age: 18 }, { age: 18, closeness: 10 }), 'p-5').propose).toBe('You need to be 19 to marry.')
    expect(blockedOf(withRani({}, { age: 18, closeness: 10 }), 'p-5').propose).toBe('Rani needs to be 19 to marry.')
    expect(blockedOf(withRani({}, { closeness: 69 }), 'p-5').propose).toBe('You are not close enough yet.')
    expect(actionsFor(testLife({ people: [...testLife().people, { ...rani, relation: 'spouse' }] }), 'p-5').map((a) => a.id)).not.toContain('propose')
  })
  it('marries and queues the wedding when a proposal succeeds', () => {
    const rani: Person = { id: 'p-5', name: 'Rani', relation: 'partner', gender: 'female', age: 25, closeness: 80, since: 18 }
    const life = testLife({ age: 22, people: [...testLife().people, rani] })
    const wed = afterEvent(life, 'propose', { them: 'p-5' }, 'success')
    expect(wed.people[3]).toMatchObject({ relation: 'spouse', since: 22 })
    expect(wed.pendingEvents).toEqual([{ eventId: 'wedding', cast: { them: 'p-5' } }])
    expect(afterEvent(life, 'propose', { them: 'p-5' }, 'mixed')).toBe(life)
  })
  it('says what time and talking cost, and warns of overwork', () => {
    const detail = (life: Life) => Object.fromEntries(actionsFor(life, 'p-3').map((a) => [a.id, a.detail]))
    expect(detail(testLife())).toMatchObject({ time: expect.stringContaining('1 energy'), talk: expect.stringContaining('1 energy') })
    expect(detail(testLife()).talk).not.toContain('overwork')
    const tired = detail(testLife({ energySpent: 10 }))
    expect([tired.time, tired.talk].every((d) => d!.includes('1 energy · overwork'))).toBe(true)
  })
  it('spends energy talking, counts it as time together and queues the talk', () => {
    const life = talk(testLife(), 'p-3')
    expect([life.energySpent, life.spentWith, life.pendingEvents]).toEqual([1, ['p-3'], [{ eventId: 'talk', cast: { them: 'p-3' } }]])
    expect(life.stats).toEqual(testLife().stats)
    const tired = talk(testLife({ energySpent: 10 }), 'p-3')
    expect([tired.energySpent, tired.stats.stress, tired.stats.health]).toEqual([11, 39, 56])
    expect(tired.journal.at(-1)).toMatchObject({ kind: 'activity', changes: [{ key: 'stress', delta: 4 }, { key: 'health', delta: -2 }] })
  })
})
