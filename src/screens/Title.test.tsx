import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { App } from '../app/App'
import { GAME_NAME } from '../app/name'
import { useApp } from '../app/store'
import { createSaves } from '../engine/save/saves'
import { memoryStore } from '../engine/save/storage'
import { testLife } from '../life/testLife'

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
