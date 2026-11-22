import { expect, it } from 'vitest'
import { packFor } from '../content'
import { createSaves, type SaveFile } from '../engine/save/saves'
import { memoryStore } from '../engine/save/storage'
import { rollLife } from '../life/roll'
import { testLife } from '../life/testLife'
import { useApp } from './store'

const app = useApp.getState
const flush = () => new Promise((r) => setTimeout(r, 0))
const fresh = async (file?: SaveFile) => {
  const saves = createSaves(memoryStore())
  if (file) await saves.store(file)
  useApp.setState(useApp.getInitialState())
  await app().boot(saves)
  return saves
}

it('boots to the title, with or without an active life', async () => {
  await fresh()
  expect(app()).toMatchObject({ ready: true, screen: 'title', life: null, past: [] })
  await fresh({ version: 4, active: testLife(), past: [testLife({ id: 'old' })] })
  expect(app().screen).toBe('title')
  expect(app().past.map((l) => l.id)).toEqual(['old'])
  app().continueLife()
  expect(app().screen).toBe('year')
})

it('rolls the same life from the same seed, and a different one on re-roll', async () => {
  await fresh()
  app().newRoll(3)
  const first = app().roll
  app().newRoll(3)
  expect(app()).toMatchObject({ screen: 'new-life', roll: first })
  expect(first).toEqual(rollLife(3))
  app().newRoll()
  expect(app().roll!.seed).not.toBe(3)
})

it('starts the rolled life at birth, with the birth milestone first, and saves it', async () => {
  const saves = await fresh()
  app().newRoll(3)
  app().editRoll({ name: '  Sari   Dewi ', gender: 'female' })
  app().startLife()
  const roll = rollLife(3)
  const { life } = app()
  expect(app()).toMatchObject({ screen: 'year', roll: null })
  expect(life).toMatchObject({ age: 0, name: 'Sari Dewi', gender: 'female', city: roll.city, wealth: roll.wealth, money: 0 })
  expect(life!.journal[0]).toEqual({ age: 0, kind: 'milestone', text: packFor('indonesia').milestones[0], changes: [] })
  expect(app().pendingEvent).toEqual(life!.pendingEvents[0] ?? null)
  await flush()
  expect((await saves.load()).active).toEqual(life)
})

it('will not start with an empty name', async () => {
  await fresh()
  app().newRoll(3)
  app().editRoll({ name: '   ' })
  app().startLife()
  expect(app()).toMatchObject({ screen: 'new-life', life: null })
})

it('asks before replacing an unfinished life, and changes nothing on no', async () => {
  const active = testLife()
  await fresh({ version: 4, active, past: [] })
  app().newRoll(3)
  app().startLife()
  expect(app()).toMatchObject({ confirmAbandon: true, screen: 'new-life', life: active })
  app().answerAbandon(false)
  expect(app()).toMatchObject({ confirmAbandon: false, screen: 'new-life', life: active, past: [] })
})

it('moves the old life to past lives as unfinished on yes, in one save', async () => {
  const old = testLife({ id: 'old' })
  const saves = await fresh({ version: 4, active: old, past: [testLife({ id: 'older' })] })
  const writes: SaveFile[] = []
  const store = saves.store
  saves.store = (file) => {
    writes.push(file)
    return store(file)
  }
  app().newRoll(3)
  app().startLife()
  app().answerAbandon(true)
  expect(app()).toMatchObject({ confirmAbandon: false, screen: 'year' })
  expect(app().life!.id).toBe('life-3')
  expect(app().past.map((l) => [l.id, l.death])).toEqual([['older', null], ['old', null]])
  expect(writes).toHaveLength(1)
  expect(writes[0]!.past.map((l) => l.id)).toEqual(['older', 'old'])
  expect(writes[0]!.active!.id).toBe('life-3')
})

it('goes to the title from the year, but not while something is showing', async () => {
  await fresh({ version: 4, active: testLife(), past: [] })
  app().continueLife()
  useApp.setState({ pendingEvent: { eventId: 'x', cast: {} } })
  app().goTitle()
  expect(app().screen).toBe('year')
  useApp.setState({ pendingEvent: null })
  app().goTitle()
  expect(app().screen).toBe('title')
})
