import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { App } from '../app/App'
import { GAME_NAME } from '../app/name'
import { exportText } from '../app/backup'
import { useApp } from '../app/store'
import { createSaves } from '../engine/save/saves'
import { memoryStore } from '../engine/save/storage'
import { testLife } from '../life/testLife'

const download = vi.hoisted(() => vi.fn<(name: string, text: string) => void>())
vi.mock('../app/backup', async (orig) => ({ ...(await orig<typeof import('../app/backup')>()), downloadText: download }))

const boot = async (active = testLife()) => {
  const saves = createSaves(memoryStore())
  await saves.store({ version: 3, active, past: [] })
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(saves)
  render(<App />)
}

it('offers Continue for an active life, and goes back to it', async () => {
  await boot()
  expect(screen.getByRole('heading', { name: GAME_NAME })).toBeTruthy()
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
  expect(useApp.getState().screen).toBe('year')
  await userEvent.click(screen.getByRole('button', { name: 'Menu' }))
  expect(useApp.getState().screen).toBe('title')
  expect(useApp.getState().life!.id).toBe('life-test')
})

it('has no Continue without an active life, and opens the roll', async () => {
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(createSaves(memoryStore()))
  render(<App />)
  expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Start a life' }))
  expect(useApp.getState().screen).toBe('new-life')
})

const upload = (text: string) =>
  userEvent.upload(screen.getByLabelText('Import'), new File([text], 'saves.json', { type: 'application/json' }))

it('exports the current saves', async () => {
  await boot()
  await userEvent.click(screen.getByRole('button', { name: 'Export' }))
  expect(download).toHaveBeenCalledWith('life-sim-saves.json', exportText({ version: 3, active: useApp.getState().life, past: [] }))
})

it('replaces saves with a valid file only on yes', async () => {
  await boot()
  const file = { version: 3 as const, active: null, past: [testLife({ id: 'old' })] }
  await upload(exportText(file))
  expect(screen.getByText('Replace your current life and past lives with this file?')).toBeTruthy()
  await userEvent.click(screen.getByRole('button', { name: 'Keep mine' }))
  expect(useApp.getState().life!.id).toBe('life-test')
  await upload(exportText(file))
  await userEvent.click(screen.getByRole('button', { name: 'Replace' }))
  expect(useApp.getState().life).toBeNull()
  expect(useApp.getState().past.map((l) => l.id)).toEqual(['old'])
})

it('refuses a file that is not a save', async () => {
  await boot()
  await upload('nope')
  expect((await screen.findByRole('alert')).textContent).toBe("That file isn't a life-sim save, or it's damaged.")
  expect(useApp.getState().life!.id).toBe('life-test')
})
