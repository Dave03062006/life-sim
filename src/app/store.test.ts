import { expect, it, vi } from 'vitest'
import type { EventAction, EventDef } from '../content/types'
import { createSaves } from '../engine/save/saves'
import { memoryStore } from '../engine/save/storage'
import { testLife } from '../life/testLife'
import type { Person } from '../life/types'
import { useApp } from './store'

const events = vi.hoisted(() => [] as EventDef[])
vi.mock('../content', async (orig) => {
  const real = await orig<typeof import('../content')>()
  return { packFor: (country: 'indonesia') => ({ ...real.packFor(country), events }) }
})
const outcomes = (text: string): EventAction['outcomes'] => ({ success: { text }, mixed: { text }, fail: { text } })
const choice = (id: string, more: Partial<EventDef> = {}): EventDef => ({
  id, kind: 'choice', stages: ['late-teen'], weight: 1, title: id, text: id,
  actions: [{ id: 'a', label: 'Go along', chance: 100, outcomes: outcomes(`${id} done`) }], ...more,
})
const builtIns = [
  choice('talk', { weight: 0, cast: { them: 'friend' }, actions: [{ id: 'chat', label: 'Chat', chance: 100, outcomes: { ...outcomes('You talked.'), success: { text: 'You talked with {them}.', closeness: { them: 5 } } } }] }),
  choice('ask-out', { weight: 0, cast: { them: 'crush' } }),
]
const ayu: Person = { id: 'p-4', name: 'Ayu', relation: 'crush', gender: 'female', age: 16, closeness: 60 }

const fresh = async (...extra: EventDef[]) => {
  events.splice(0, events.length, ...builtIns, ...extra)
  const saves = createSaves(memoryStore())
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(saves)
  return saves
}
const flush = () => new Promise((r) => setTimeout(r, 0))

it('boots empty, then starts a life at 15', async () => {
  await fresh()
  expect(useApp.getState()).toMatchObject({ ready: true, life: null })
  useApp.getState().startDemoLife(7)
  expect(useApp.getState().life!.age).toBe(15)
})
it('plays an activity once, journals it and saves it', async () => {
  const saves = await fresh()
  const app = useApp.getState
  app().startDemoLife(7)
  const before = app().life!.stats.health
  app().begin('jog')
  expect(app().playing!.def.id).toBe('jog')
  app().finish(0.9)
  app().finish(0.9) // a second press must do nothing
  expect(app().life!.stats.health).toBe(Math.min(100, before + 5))
  expect(app().lastResult!.tier).toBe('great')
  expect(app().life!.journal.at(-1)!.kind).toBe('activity')
  await flush()
  expect((await saves.load()).active).toEqual(app().life)
  app().closeResult()
  expect(app()).toMatchObject({ playing: null, lastResult: null })
})
it('finishes an activity with no mini-game at once, and ignores a blocked one', async () => {
  await fresh()
  const app = useApp.getState
  app().startDemoLife(7)
  app().begin('clothes')
  expect(app().playing).toBeNull()
  expect(app().lastResult!.tier).toBe('good')
  app().closeResult()
  app().begin('motorbike')
  expect(app()).toMatchObject({ playing: null, lastResult: null })
})
it('ages up, shows the birthday and closes the sheet', async () => {
  await fresh()
  const app = useApp.getState
  app().startDemoLife(7)
  app().open('body')
  app().ageUp()
  expect(app()).toMatchObject({ birthday: 16, openCategory: null })
  expect(app().life!.age).toBe(16)
  app().endBirthday()
  expect(app().birthday).toBeNull()
})
it('comes back after a reload', async () => {
  const saves = createSaves(memoryStore())
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(saves)
  useApp.getState().startDemoLife(7)
  await flush()
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(saves)
  expect(useApp.getState().life!.age).toBe(15)
})
it('keeps playing when saving fails', async () => {
  const failing = { ...memoryStore(), set: () => Promise.reject(new Error('quota')) }
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(createSaves(failing))
  useApp.getState().startDemoLife(7)
  useApp.getState().begin('jog')
  useApp.getState().finish(0.9)
  await flush()
  expect(useApp.getState().lastResult!.tier).toBe('great')
})
it('ignores a second boot', async () => {
  const saves = await fresh()
  useApp.getState().startDemoLife(7)
  const life = useApp.getState().life
  await useApp.getState().boot(saves)
  expect(useApp.getState().life).toBe(life)
})
it('lets only one of two overlapping boots load', async () => {
  const saves = createSaves(memoryStore())
  useApp.setState(useApp.getInitialState())
  await Promise.all([useApp.getState().boot(saves), useApp.getState().boot(saves)])
  useApp.getState().startDemoLife(7)
  const life = useApp.getState().life
  await flush()
  await useApp.getState().boot(saves)
  expect(useApp.getState().life).toBe(life)
})
it('does nothing out of turn while a mini-game is playing', async () => {
  await fresh()
  const app = useApp.getState
  app().startDemoLife(7)
  app().begin('futsal')
  const life = app().life
  app().ageUp()
  app().begin('clothes')
  expect(app()).toMatchObject({ life, birthday: null, lastResult: null })
  expect(app().playing!.def.id).toBe('futsal')
})
it('keeps past lives when it saves', async () => {
  const saves = createSaves(memoryStore())
  await saves.store({ version: 2, active: testLife({ age: 15 }), past: [testLife({ id: 'old' })] })
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(saves)
  useApp.getState().begin('clothes')
  await flush()
  const file = await saves.load()
  expect(file.past.map((l) => l.id)).toEqual(['old'])
  expect(file.active!.journal).toHaveLength(1)
})
it('draws a different seed for each game from the life, and replays it', async () => {
  await fresh()
  const app = useApp.getState
  app().startDemoLife(7)
  const rng = app().life!.rng
  app().begin('jog')
  const first = app().playing!.seed
  expect(app().life!.rng).not.toBe(rng)
  app().finish(0.6); app().closeResult()
  app().begin('jog')
  expect(app().playing!.seed).not.toBe(first)
  useApp.setState({ life: { ...app().life!, rng }, playing: null, lastResult: null })
  app().begin('jog')
  expect(app().playing!.seed).toBe(first)
})
it('saves the advanced seed when a game starts', async () => {
  const saves = await fresh()
  useApp.getState().startDemoLife(7)
  useApp.getState().begin('jog')
  await flush()
  expect((await saves.load()).active!.rng).toBe(useApp.getState().life!.rng)
})
it('shows events after the birthday, one at a time, and saves them', async () => {
  const saves = await fresh(choice('e1'), choice('e2'), choice('e3'))
  const app = useApp.getState
  app().startDemoLife(7)
  app().ageUp()
  const queued = app().life!.pendingEvents
  expect(queued.length).toBeGreaterThanOrEqual(1)
  expect(app().pendingEvent).toBeNull() // the birthday comes first
  await flush()
  expect((await saves.load()).active!.pendingEvents).toEqual(queued)
  app().endBirthday()
  for (const [i, ev] of queued.entries()) {
    expect(app().pendingEvent).toEqual(ev)
    app().decide('a', 'calm')
    expect(app().lastEvent!.entry.text).toBe(`${ev.eventId} done`)
    expect(app().lastEvent!.def.id).toBe(ev.eventId)
    expect(app().life!.pendingEvents).toEqual(queued.slice(i + 1))
    await flush()
    expect((await saves.load()).active!.pendingEvents).toEqual(queued.slice(i + 1))
    app().decide('a', 'calm') // a second press must do nothing
    expect(app().life!.pendingEvents).toEqual(queued.slice(i + 1))
    app().closeEvent()
    expect(app().lastEvent).toBeNull()
  }
  expect(app().pendingEvent).toBeNull()
})
it('refuses other actions while an event waits', async () => {
  await fresh(choice('e1'))
  const app = useApp.getState
  app().startDemoLife(7)
  app().ageUp()
  app().endBirthday()
  expect(app().pendingEvent!.eventId).toBe('e1')
  const life = app().life
  app().begin('jog')
  app().ageUp()
  app().personAction('p-1', 'gift')
  expect(app()).toMatchObject({ life, playing: null, lastResult: null, birthday: null })
  app().decide('a', 'calm')
  const after = app().life
  app().begin('jog')
  app().ageUp()
  expect(app()).toMatchObject({ life: after, playing: null, birthday: null })
})
it('skips an event whose person has gone', async () => {
  await fresh(choice('e1'))
  useApp.setState({ life: testLife({ pendingEvents: [{ eventId: 'talk', cast: { them: 'p-9' } }, { eventId: 'e1', cast: {} }] }) })
  useApp.getState().endBirthday() // the dialog never opens for it
  expect(useApp.getState()).toMatchObject({ lastEvent: null, pendingEvent: { eventId: 'e1', cast: {} } })
  expect(useApp.getState().life!.pendingEvents).toEqual([{ eventId: 'e1', cast: {} }])
})
it('never lets an event missing from the pack block the year', async () => {
  const saves = createSaves(memoryStore())
  events.splice(0, events.length, ...builtIns, choice('e1'))
  const unknown = { eventId: 'removed', cast: {} }
  await saves.store({ version: 2, active: testLife({ pendingEvents: [unknown, { eventId: 'e1', cast: {} }] }), past: [] })
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(saves)
  expect(useApp.getState().pendingEvent).toEqual({ eventId: 'e1', cast: {} })
  await flush()
  expect((await saves.load()).active!.pendingEvents).toEqual([{ eventId: 'e1', cast: {} }])

  const only = createSaves(memoryStore())
  await only.store({ version: 2, active: testLife({ age: 15, pendingEvents: [unknown] }), past: [] })
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(only)
  expect(useApp.getState().pendingEvent).toBeNull()
  useApp.getState().ageUp()
  expect(useApp.getState()).toMatchObject({ birthday: 16 })
})
it('brings back an unanswered event after reload', async () => {
  const saves = createSaves(memoryStore())
  events.splice(0, events.length, ...builtIns, choice('e1'))
  await saves.store({ version: 2, active: testLife({ pendingEvents: [{ eventId: 'e1', cast: {} }] }), past: [] })
  useApp.setState(useApp.getInitialState())
  expect(useApp.getState().pendingEvent).toBeNull()
  await useApp.getState().boot(saves)
  expect(useApp.getState().pendingEvent).toEqual({ eventId: 'e1', cast: {} })
})
it('spends time with a person through a mini-game', async () => {
  const saves = await fresh()
  const app = useApp.getState
  useApp.setState({ life: testLife() })
  const rng = app().life!.rng
  app().personAction('p-3', 'time')
  expect(app().playing).toMatchObject({ def: { id: 'time:p-3' }, personId: 'p-3' })
  expect(app().life!.rng).not.toBe(rng)
  await flush()
  expect((await saves.load()).active!.rng).toBe(app().life!.rng)
  app().finish(0.9)
  expect(app().life!.people.find((p) => p.id === 'p-3')!.closeness).toBe(72)
  expect(app().life!.stats.happiness).toBe(71 + 5)
  expect(app().life!.spentWith).toEqual(['p-3'])
  expect(app().lastResult!.entry.people).toEqual([{ id: 'p-3', delta: 12 }])
})
it('talks with a person through the built-in event', async () => {
  await fresh()
  const app = useApp.getState
  useApp.setState({ life: testLife() })
  app().personAction('p-3', 'talk')
  expect(app().pendingEvent).toEqual({ eventId: 'talk', cast: { them: 'p-3' } })
  expect([app().life!.energySpent, app().life!.spentWith]).toEqual([1, ['p-3']])
  app().decide('chat', 'blunt')
  expect(app().lastEvent!.entry).toMatchObject({ text: 'You talked with Dimas.', people: [{ id: 'p-3', delta: 8 }] })
  app().closeEvent()
  expect(app().pendingEvent).toBeNull()
  events.splice(0, events.length)
  const life = app().life
  app().personAction('p-3', 'talk')
  expect(app()).toMatchObject({ life, pendingEvent: null })
})
it('gives a gift when you can pay, and not otherwise', async () => {
  const saves = await fresh()
  const app = useApp.getState
  useApp.setState({ life: testLife() })
  app().personAction('p-3', 'gift')
  expect(app().life!.money).toBe(165000)
  expect(app().life!.journal.at(-1)!.people).toEqual([{ id: 'p-3', delta: 10 }])
  await flush()
  expect((await saves.load()).active).toEqual(app().life)
  const poor = testLife({ money: 40000 })
  useApp.setState({ life: poor })
  app().personAction('p-3', 'gift')
  expect(app().life).toBe(poor)
})
it('asks who you are interested in once, before the first romance option', async () => {
  const saves = await fresh()
  const app = useApp.getState
  const rafi: Person = { ...ayu, id: 'p-5', name: 'Rafi' }
  useApp.setState({ life: testLife({ people: [...testLife().people, ayu, rafi] }) })
  app().personAction('p-4', 'ask-out')
  expect(app()).toMatchObject({ askingInterest: true, pendingEvent: null })
  app().personAction('p-3', 'gift') // the question is a dialog: nothing else starts
  expect(app().life!.money).toBe(215000)
  app().setInterest('women')
  expect(app()).toMatchObject({ askingInterest: false, pendingEvent: { eventId: 'ask-out', cast: { them: 'p-4' } } })
  expect(app().life!.interest).toBe('women')
  await flush()
  expect((await saves.load()).active!.interest).toBe('women')
  app().decide('a', 'calm')
  expect(app().life!.people.find((p) => p.id === 'p-4')!.relation).toBe('partner')
  app().closeEvent()
  useApp.setState({ life: { ...app().life!, people: app().life!.people.filter((p) => p.id !== 'p-4') } }) // one partner at a time
  app().personAction('p-5', 'ask-out')
  expect(app()).toMatchObject({ askingInterest: false, pendingEvent: { eventId: 'ask-out', cast: { them: 'p-5' } } })
})
it('asks the question before an event with a romance option', async () => {
  const flirt: EventAction = { id: 'flirt', label: 'Flirt', chance: 50, romance: true, outcomes: outcomes('You flirted.') }
  await fresh(choice('party', { actions: [...choice('party').actions!, flirt] }))
  useApp.setState({ life: testLife({ pendingEvents: [{ eventId: 'party', cast: {} }] }) })
  useApp.getState().endBirthday()
  expect(useApp.getState()).toMatchObject({ askingInterest: true, pendingEvent: null })
  useApp.getState().setInterest('none')
  expect(useApp.getState()).toMatchObject({ askingInterest: false, pendingEvent: { eventId: 'party', cast: {} } })
})
