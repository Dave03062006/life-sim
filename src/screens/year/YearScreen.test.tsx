import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { App } from '../../app/App'
import { useApp } from '../../app/store'
import { createSaves } from '../../engine/save/saves'
import { memoryStore } from '../../engine/save/storage'
import { useSettings } from '../../engine/settings'
import { testLife } from '../../life/testLife'

const start = async () => {
  useSettings.getState().update({ reducedMotion: 'on' })
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(createSaves(memoryStore()))
  useApp.setState({ life: testLife({ age: 16 }) })
  render(<App />)
}

it('shows who you are and what you can do', async () => {
  await start()
  expect(screen.getByRole('heading', { name: 'Raka Pratama' })).toBeTruthy()
  expect(screen.getByRole('meter', { name: 'Health' }).getAttribute('aria-valuenow')).toBe('58')
  expect(screen.getAllByRole('meter')).toHaveLength(6)
  expect(screen.getByText('Rp 215.000')).toBeTruthy()
  expect(screen.getByText('10 of 10 left')).toBeTruthy()
  for (const name of ['School', 'Mind', 'Body', 'Health', 'People', 'Money', 'Fun', 'Rest']) expect(screen.getByRole('button', { name })).toBeTruthy()
  expect(screen.getByRole('button', { name: /Turn 17/ })).toBeTruthy()
})

it('opens a category and explains what is closed', async () => {
  await start()
  await userEvent.click(screen.getByRole('button', { name: 'Money' }))
  expect(screen.getAllByRole('button', { name: /energy|Rp|No energy|From age/ }).length).toBeGreaterThanOrEqual(6)
  const bike = screen.getByRole('button', { name: /Buy a motorbike/ }) as HTMLButtonElement
  expect(bike.disabled).toBe(true)
  expect(bike.textContent).toContain('From age 17, with a SIM C licence')
})

it('rests, and shows the change in the journal', async () => {
  await start()
  act(() => useApp.setState({ life: testLife({ energySpent: 5 }) }))
  await userEvent.click(screen.getByRole('button', { name: 'Rest' }))
  await userEvent.click(screen.getByRole('button', { name: /Sleep in/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Back to your year' }))
  expect(screen.getByText('8 of 10 left')).toBeTruthy()
  expect(screen.getByText('Energy +3')).toBeTruthy()
})

it('ages up', async () => {
  await start()
  await userEvent.click(screen.getByRole('button', { name: /Turn 17/ }))
  expect(screen.getByRole('button', { name: /Turn 18/ })).toBeTruthy()
  expect(screen.getByText(/became a KTP/)).toBeTruthy()
})

it('shows the birthday for a moment, then the new year', async () => {
  await start()
  useSettings.getState().update({ reducedMotion: 'off' })
  vi.useFakeTimers()
  try {
    act(() => useApp.getState().ageUp())
    expect(screen.getByText('Happy birthday')).toBeTruthy()
    act(() => vi.advanceTimersByTime(1250))
    expect(screen.queryByText('Happy birthday')).toBeNull()
  } finally {
    vi.useRealTimers()
  }
})
