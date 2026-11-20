import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from '../app/App'
import { useApp } from '../app/store'
import { createSaves } from '../engine/save/saves'
import { memoryStore } from '../engine/save/storage'
import { useSettings } from '../engine/settings'
import { testLife } from '../life/testLife'

const start = async () => {
  useSettings.getState().reset()
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(createSaves(memoryStore()))
  useApp.setState({ life: testLife() })
  render(<App />)
}

it('switches skin at once and remembers it', async () => {
  await start()
  await userEvent.click(screen.getByRole('button', { name: 'Pixel' }))
  expect(document.documentElement.dataset.style).toBe('pixel')
  expect(useSettings.getState().style).toBe('pixel')
  expect(screen.getByRole('button', { name: 'Pixel' }).getAttribute('aria-pressed')).toBe('true')
})

it('turns sound, motion and relaxed play on and off', async () => {
  await start()
  await userEvent.click(screen.getByRole('button', { name: 'Sound on' }))
  expect(useSettings.getState().sound).toBe(false)
  await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
  await userEvent.click(screen.getByRole('checkbox', { name: 'Reduce motion' }))
  await userEvent.click(screen.getByRole('checkbox', { name: 'Relaxed mini-games' }))
  expect(useSettings.getState()).toMatchObject({ reducedMotion: 'on', relaxed: true })
  expect(document.documentElement.dataset.motion).toBe('reduce')
})

it('opens categories with 1 to 8 and closes with Escape', async () => {
  await start()
  await userEvent.keyboard('3')
  expect(useApp.getState().openCategory).toBe('body')
  await userEvent.keyboard('{Escape}')
  expect(useApp.getState().openCategory).toBeNull()
  act(() => useApp.getState().begin('futsal'))
  await userEvent.keyboard('5')
  expect(useApp.getState().openCategory).toBeNull()
})

it('runs a dialog that holds focus, names its note and gives focus back', async () => {
  await start()
  const button = screen.getByRole('button', { name: 'Settings' })
  await userEvent.click(button)
  const dialog = screen.getByRole('dialog', { name: 'Settings' })
  expect(dialog.getAttribute('aria-modal')).toBe('true')
  expect(dialog.contains(document.activeElement)).toBe(true)
  expect(screen.getByText('This is a game. Its health figures are simplified from the sources it lists, and it is not medical advice.')).toBeTruthy()
  await userEvent.keyboard('3')
  expect(useApp.getState().openCategory).toBeNull()
  await userEvent.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(button)
})

afterEach(() => vi.unstubAllGlobals())

it('lets the player turn motion back on when the device asks for less', async () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  await start()
  await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
  const box = screen.getByRole('checkbox', { name: 'Reduce motion' }) as HTMLInputElement
  expect(box.checked).toBe(true)
  await userEvent.click(box)
  expect(useSettings.getState().reducedMotion).toBe('off')
  expect(document.documentElement.dataset.motion).not.toBe('reduce')
})

it('keeps focus on the checkbox you just toggled', async () => {
  await start()
  await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
  const box = screen.getByRole('checkbox', { name: 'Reduce motion' })
  await userEvent.click(box)
  expect(document.activeElement).toBe(box)
})
