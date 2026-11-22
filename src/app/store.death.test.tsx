import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { createSaves, type SaveFile } from '../engine/save/saves'
import { memoryStore } from '../engine/save/storage'
import { testLife } from '../life/testLife'
import { App } from './App'
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

it('moves a life that dies at Age Up to past lives, and shows its summary', async () => {
  const saves = await fresh({ version: 4, active: testLife({ age: 115 }), past: [testLife({ id: 'old' })] }) // certain death at 115
  app().continueLife()
  app().ageUp()
  const { life, past, screen: shown, summaryId, birthday, pendingEvent } = app()
  expect(life).toBeNull()
  expect(past.map((l) => l.id)).toEqual(['old', 'life-test'])
  expect(past.at(-1)!.death).toEqual({ age: 115, cause: 'Old age' })
  expect({ shown, summaryId, birthday, pendingEvent }).toEqual({ shown: 'summary', summaryId: 'life-test', birthday: null, pendingEvent: null })
  await flush()
  const file = await saves.load()
  expect(file.active).toBeNull()
  expect(file.past.at(-1)!.death).not.toBeNull()

  useApp.setState(useApp.getInitialState())
  await app().boot(saves)
  render(<App />)
  expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull()
  expect(screen.getByRole('button', { name: 'Past lives (2)' })).toBeTruthy()
})

it('moves an old save whose active life has died to past lives on load', async () => {
  const saves = await fresh({ version: 4, active: testLife({ death: { age: 16, cause: 'An accident' } }), past: [] })
  expect(app()).toMatchObject({ screen: 'title', life: null })
  expect(app().past.map((l) => l.id)).toEqual(['life-test'])
  await flush()
  expect((await saves.load()).active).toBeNull()
})

it('opens past lives and a summary, and goes back to the title', async () => {
  await fresh({ version: 4, active: null, past: [testLife({ id: 'a' })] })
  app().showPast()
  expect(app().screen).toBe('past')
  app().showSummary('a')
  expect(app()).toMatchObject({ screen: 'summary', summaryId: 'a' })
  app().goTitle()
  expect(app().screen).toBe('title')
})
