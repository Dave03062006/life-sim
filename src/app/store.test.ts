import { expect, it } from 'vitest'
import { createSaves } from '../engine/save/saves'
import { memoryStore } from '../engine/save/storage'
import { useApp } from './store'

const fresh = async () => {
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
