import { describe, expect, it } from 'vitest'
import type { ContentPack, EventAction, EventDef, Outcome } from '../content/types'
import { createRng } from '../engine/random'
import { availableActions, drawEvents, dropStale, fill, resolveEvent, rollTier } from './events'
import { testLife } from './testLife'
import type { Life, Person } from './types'

const say = (text: string, more: Partial<Outcome> = {}): Outcome => ({ text, ...more })
const same = (o: Outcome): EventAction['outcomes'] => ({ success: o, mixed: o, fail: o })
const choice = (id: string, more: Partial<EventDef> = {}): EventDef => ({
  id, kind: 'choice', stages: ['late-teen'], weight: 1, title: id, text: id,
  actions: [{ id: 'a', label: 'Go along', chance: 100, outcomes: same(say(`${id} done`)) }],
  ...more,
})
const news = (id: string, more: Partial<EventDef> = {}): EventDef => ({
  id, kind: 'news', stages: ['late-teen'], weight: 1, title: id, text: id, news: say(`${id} happened`), ...more,
})
const packOf = (events: EventDef[]): ContentPack => ({ id: 'indonesia', activities: [], milestones: {}, events, careers: [], belongings: [] })

const coverFriend = choice('cover-friend', {
  cast: { friend: 'friend' },
  actions: [
    {
      id: 'cover', label: 'Cover for {friend}', chance: 100,
      outcomes: same(say('You covered for {friend}.', {
        effects: { happiness: 4, stress: 2 }, money: -10000, closeness: { friend: 20 },
        memory: { id: 'covered-friend', text: 'You covered for {friend}.' },
      })),
    },
    {
      id: 'speak', label: 'Speak up', chance: 0,
      open: { condition: { kind: 'stat', key: 'reputation', min: 60 }, note: 'Open to you: Reputation 60+' },
      outcomes: same(say('You spoke up.')),
    },
    { id: 'flirt', label: 'Flirt', chance: 50, romance: true, outcomes: same(say('You flirted.')) },
  ],
})
const recallFriend = choice('friend-again', {
  cast: { friend: 'friend' },
  recall: { memory: 'covered-friend', text: '{friend} has not forgotten that you covered for him.' },
})
const failing = choice('bad-day', { actions: [{ id: 'a', label: 'Try', chance: 0, outcomes: same(say('It went wrong.', { effects: { stress: 4 } })) }] })
const pack = packOf([coverFriend, recallFriend, failing])

const pending = (eventId: string, cast: Record<string, string> = {}) => [{ eventId, cast }]

describe('drawing events', () => {
  const big = packOf([
    choice('c1'), choice('c2'), news('n1'), news('n2'), choice('b1', { big: true }), choice('b2', { big: true }), news('b3', { big: true }),
    choice('kid', { stages: ['child'] }), news('rich', { when: [{ kind: 'money', min: 10_000_000 }] }),
  ])
  it('draws one to three fitting events, never repeats one, and at most one big', () => {
    const counts = new Set<number>()
    for (let seed = 1; seed <= 200; seed++) {
      const once = drawEvents(testLife({ rng: seed }), big)
      const twice = drawEvents(once, big)
      counts.add(once.seenEvents.length)
      expect(once.seenEvents.length).toBeGreaterThanOrEqual(1)
      expect(once.seenEvents.length).toBeLessThanOrEqual(3)
      expect(new Set(twice.seenEvents).size).toBe(twice.seenEvents.length)
      expect(once.seenEvents.filter((id) => id.startsWith('b')).length).toBeLessThanOrEqual(1)
      expect(once.seenEvents).not.toContain('kid')
      expect(once.seenEvents).not.toContain('rich')
      expect(once.rng).not.toBe(seed)
    }
    expect(counts).toEqual(new Set([1, 2, 3]))
  })
  it('is the same for the same seed', () => {
    expect(drawEvents(testLife({ rng: 7 }), big)).toEqual(drawEvents(testLife({ rng: 7 }), big))
  })
  it('skips an event whose cast cannot be filled', () => {
    const crushPack = packOf([choice('note', { cast: { crush: 'crush' } }), choice('filler')])
    const ayu: Person = { id: 'p-4', name: 'Ayu', relation: 'crush', gender: 'female', age: 16, closeness: 50 }
    const withAyu = testLife().people.concat(ayu)
    for (let seed = 1; seed <= 50; seed++) {
      expect(drawEvents(testLife({ rng: seed }), crushPack).seenEvents).toEqual(['filler'])
      expect(drawEvents(testLife({ rng: seed, people: withAyu, interest: 'men' }), crushPack).seenEvents).toEqual(['filler'])
      expect(drawEvents(testLife({ rng: seed, people: withAyu, interest: null }), crushPack).seenEvents).toEqual(['filler'])
    }
    const drawn = Array.from({ length: 50 }, (_, i) => drawEvents(testLife({ rng: i + 1, people: withAyu, interest: 'women' }), crushPack))
    const noted = drawn.find((l) => l.seenEvents.includes('note'))!
    expect(noted.pendingEvents.find((p) => p.eventId === 'note')!.cast).toEqual({ crush: 'p-4' })
    const pair = packOf([choice('two', { cast: { a: 'friend', b: 'friend' } })])
    expect(drawEvents(testLife(), pair).seenEvents).toEqual([])
  })
  it('applies news at once and queues choices', () => {
    const shout = news('shout', { cast: { mum: 'mother' }, news: say('{mum} shouted.', { effects: { stress: 5 }, money: 5000, closeness: { mum: -10 } }) })
    const life = drawEvents(testLife(), packOf([shout]))
    expect(life.stats.stress).toBe(40)
    expect(life.money).toBe(220000)
    expect(life.people.find((p) => p.id === 'p-1')!.closeness).toBe(60)
    expect(life.journal).toEqual([{ age: 16, kind: 'event', text: 'Siti shouted.', changes: [{ key: 'stress', delta: 5 }, { key: 'money', delta: 5000 }], people: [{ id: 'p-1', delta: -10 }] }])
    expect(life.pendingEvents).toEqual([])
    const queued = drawEvents(testLife(), packOf([coverFriend]))
    expect(queued.pendingEvents).toEqual(pending('cover-friend', { friend: 'p-3' }))
    expect(queued.journal).toEqual([])
    expect(queued.stats).toEqual(testLife().stats)
  })
})

describe('resolving events', () => {
  it('rolls tiers from chance, manner and luck, the same for the same seed', () => {
    const rolls = (life: Life, chance: number, manner: 'calm' | 'blunt' | 'joke', seed = 3) => {
      const rng = createRng(seed)
      return Array.from({ length: 500 }, () => rollTier(life, chance, manner, rng))
    }
    expect(rolls(testLife(), 100, 'calm').every((t) => t === 'success')).toBe(true)
    expect(rolls(testLife(), 0, 'calm')).not.toContain('success')
    expect(rolls(testLife(), 0, 'blunt')).not.toContain('success')
    expect(new Set(rolls(testLife(), 45, 'calm'))).toEqual(new Set(['success', 'mixed', 'fail']))
    const high = testLife({ stats: { ...testLife().stats, happiness: 90, reputation: 90 } })
    const low = testLife({ stats: { ...testLife().stats, happiness: 10, reputation: 10 } })
    const wins = (tiers: string[]) => tiers.filter((t) => t === 'success').length
    expect(wins(rolls(high, 40, 'joke'))).toBeGreaterThan(wins(rolls(low, 40, 'joke')) + 200)
    expect(rolls(testLife(), 45, 'joke', 9)).toEqual(rolls(testLife(), 45, 'joke', 9))
  })
  it('fills names and roles', () => {
    expect(fill('{name} and {friend} met {who}.', testLife(), { friend: 'p-3' })).toBe('Raka Pratama and Dimas met {who}.')
  })
  it('scales outcomes by manner and keeps everything within bounds', () => {
    const life = testLife({ pendingEvents: pending('cover-friend', { friend: 'p-3' }) })
    const blunt = resolveEvent(life, pack, 'cover', 'blunt')
    expect(blunt.tier).toBe('success')
    expect([blunt.life.stats.happiness, blunt.life.stats.stress, blunt.life.money]).toEqual([77, 38, 205000])
    expect(blunt.life.people.find((p) => p.id === 'p-3')!.closeness).toBe(90)
    const calm = resolveEvent(life, pack, 'cover', 'calm')
    expect([calm.life.stats.happiness, calm.life.stats.stress, calm.life.money]).toEqual([74, 35, 205000])
    expect(calm.life.people.find((p) => p.id === 'p-3')!.closeness).toBe(75)
    expect(calm.entry).toEqual({ age: 16, kind: 'event', text: 'You covered for Dimas.', changes: [{ key: 'happiness', delta: 3 }, { key: 'money', delta: -10000 }], people: [{ id: 'p-3', delta: 15 }] })
    expect(calm.life.journal.at(-1)).toEqual(calm.entry)
    expect(calm.life.pendingEvents).toEqual([])

    const full = testLife({
      stats: { ...testLife().stats, happiness: 99 },
      people: testLife().people.map((p) => (p.id === 'p-3' ? { ...p, closeness: 95 } : p)),
      pendingEvents: pending('cover-friend', { friend: 'p-3' }),
    })
    const capped = resolveEvent(full, pack, 'cover', 'blunt')
    expect(capped.life.stats.happiness).toBe(100)
    expect(capped.entry.changes).toContainEqual({ key: 'happiness', delta: 1 })
    expect(capped.life.people.find((p) => p.id === 'p-3')!.closeness).toBe(100)
    expect(capped.entry.people).toEqual([{ id: 'p-3', delta: 5 }])
    expect(resolveEvent({ ...full, people: full.people.map((p) => ({ ...p, closeness: 100 })) }, pack, 'cover', 'blunt').entry.people).toEqual([])

    const joke = resolveEvent(testLife({ pendingEvents: pending('bad-day') }), pack, 'a', 'joke')
    expect(joke.tier).toBe('fail')
    expect(joke.life.stats.stress).toBe(40)
  })
  it('records a memory and quotes it back later', () => {
    const first = resolveEvent(testLife({ pendingEvents: pending('cover-friend', { friend: 'p-3' }) }), pack, 'cover', 'calm').life
    expect(first.memories).toEqual([{ id: 'covered-friend', age: 16, text: 'You covered for Dimas.', people: ['p-3'] }])
    const again = resolveEvent({ ...first, pendingEvents: pending('cover-friend', { friend: 'p-3' }) }, pack, 'cover', 'calm').life
    expect(again.memories).toHaveLength(1)
    const later = resolveEvent({ ...first, pendingEvents: pending('friend-again', { friend: 'p-3' }) }, pack, 'a', 'calm').life
    expect(later.journal.slice(-2).map((e) => [e.kind, e.text])).toEqual([
      ['memory', 'Dimas has not forgotten that you covered for him.'],
      ['event', 'friend-again done'],
    ])
    const fresh = resolveEvent(testLife({ pendingEvents: pending('friend-again', { friend: 'p-3' }) }), pack, 'a', 'calm').life
    expect(fresh.journal.map((e) => e.kind)).toEqual(['event'])
  })
  it('shows options open only to you, with the reason', () => {
    const ids = (life: Life) => availableActions(life, coverFriend, { friend: 'p-3' }).map((o) => [o.action.id, o.openNote])
    expect(ids(testLife())).toEqual([['cover', null], ['speak', 'Open to you: Reputation 60+']])
    expect(availableActions(testLife(), coverFriend, { friend: 'p-3' })[0]!.action.label).toBe('Cover for Dimas')
    const lowRep = testLife({ stats: { ...testLife().stats, reputation: 40 } })
    expect(ids(lowRep)).toEqual([['cover', null]])
    expect(ids(testLife({ interest: 'women' })).map(([id]) => id)).toEqual(['cover', 'speak', 'flirt'])
    expect(ids(testLife({ interest: 'none' })).map(([id]) => id)).toEqual(['cover', 'speak'])
  })
  it('drops leading pending events that cannot show', () => {
    const life = testLife({ pendingEvents: [...pending('gone-from-pack'), ...pending('cover-friend', { friend: 'p-9' }), ...pending('bad-day'), ...pending('nope')] })
    expect(dropStale(life, pack).pendingEvents).toEqual([...pending('bad-day'), ...pending('nope')])
    expect(dropStale(testLife({ pendingEvents: pending('nope') }), pack).pendingEvents).toEqual([])
    const fine = testLife({ pendingEvents: pending('bad-day') })
    expect(dropStale(fine, pack)).toBe(fine)
  })
  it('lets the moment pass when a cast person has left', () => {
    const life = testLife({ pendingEvents: [...pending('cover-friend', { friend: 'p-9' }), ...pending('bad-day')] })
    const { life: after, tier, entry } = resolveEvent(life, pack, 'cover', 'calm')
    expect(tier).toBe('mixed')
    expect(resolveEvent(life, pack, 'cover', 'calm').skipped).toBe(true)
    expect(resolveEvent(testLife({ pendingEvents: pending('bad-day') }), pack, 'a', 'calm').skipped).toBe(false)
    expect(entry.text).toBe('The moment passed.')
    expect(after).toEqual({ ...life, pendingEvents: pending('bad-day') })
  })
  it('throws when nothing is pending or the action is closed', () => {
    expect(() => resolveEvent(testLife(), pack, 'a', 'calm')).toThrow(/nothing pending/i)
    const lowRep = testLife({ stats: { ...testLife().stats, reputation: 40 }, pendingEvents: pending('cover-friend', { friend: 'p-3' }) })
    expect(() => resolveEvent(lowRep, pack, 'speak', 'calm')).toThrow(/not available/i)
    expect(() => resolveEvent(lowRep, pack, 'cover', 'shout')).toThrow(/unknown manner/i)
  })
})

describe('adding a crush', () => {
  const meet = choice('meet', { actions: [{ id: 'a', label: 'Say hello', chance: 100, outcomes: same(say('You met someone.', { addPerson: { relation: 'crush' } })) }] })
  const crushes = (life: Life) => life.people.filter((p) => p.relation === 'crush')
  const meetWith = (interest: Life['interest'], age = 16) => {
    const life = testLife({ interest, age, pendingEvents: pending('meet') })
    return resolveEvent(life, packOf([meet]), 'a', 'calm').life
  }
  it('adds one crush that matches the interest, near the player in age, at closeness 40', () => {
    const [crush] = crushes(meetWith('women'))
    expect(crushes(meetWith('women'))).toHaveLength(1)
    expect(crush).toMatchObject({ gender: 'female', closeness: 40 })
    expect(Math.abs(crush!.age - 16)).toBeLessThanOrEqual(1)
  })
  it('matches men and both', () => {
    expect(crushes(meetWith('men')).map((p) => p.gender)).toEqual(['male'])
    expect(['female', 'male']).toContain(crushes(meetWith('both'))[0]!.gender)
  })
  it('adds nobody when interest is null or none', () => {
    expect(crushes(meetWith(null))).toHaveLength(0)
    expect(crushes(meetWith('none'))).toHaveLength(0)
  })
})

describe('memories and age gates', () => {
  const friend = (id: string, name: string): Person => ({ id, name, relation: 'friend', gender: 'female', age: 16, closeness: 50 })
  const two = [friend('p-8', 'Ayu'), friend('p-9', 'Dewi')]
  const memory = { id: 'covered-friend', age: 15, text: 'You covered for Dewi.', people: ['p-9'] }
  const remember = choice('remember', { cast: { friend: 'friend' }, recall: { memory: 'covered-friend', text: 'x' } })
  it('casts the friend a memory names, and nobody if they are gone', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const life = testLife({ rng: seed, people: [...testLife().people, ...two], memories: [memory] })
      expect(drawEvents(life, packOf([remember])).pendingEvents.map((p) => p.cast.friend)).toEqual(['p-9'])
    }
    const gone = testLife({ people: [...testLife().people, two[0]!], memories: [memory] })
    expect(drawEvents(gone, packOf([remember])).pendingEvents).toEqual([])
  })
  it('checks the age condition', () => {
    const gated = packOf([choice('only-15', { when: [{ kind: 'age', min: 15, max: 15 }] })])
    expect(drawEvents(testLife({ age: 15 }), gated).seenEvents).toEqual(['only-15'])
    expect(drawEvents(testLife({ age: 16 }), gated).seenEvents).toEqual([])
  })
})
