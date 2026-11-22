import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { App } from '../../app/App'
import { useApp } from '../../app/store'
import { createSaves } from '../../engine/save/saves'
import { memoryStore } from '../../engine/save/storage'
import { useSettings } from '../../engine/settings'
import { testLife } from '../../life/testLife'
import type { Life } from '../../life/types'

const start = async (life: Life, sheet = 'School') => {
  useSettings.getState().update({ reducedMotion: 'on' })
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(createSaves(memoryStore()))
  render(<App />)
  act(() => useApp.setState({ life, screen: 'year' }))
  await userEvent.click(screen.getByRole('button', { name: sheet }))
}
const adult = (over: Partial<Life> = {}) =>
  testLife({ age: 20, money: 5_000_000, school: { ...testLife().school, at: null, done: ['tk', 'sd', 'smp', 'sma'] }, ...over })

it('shows a closed move with its reason', async () => {
  await start(testLife({ age: 13, school: { ...testLife().school, at: 'smp', done: ['tk', 'sd'] } }))
  const path = within(screen.getByRole('region', { name: 'Your path' }))
  await userEvent.click(path.getByText(/Not open yet/))
  const leave = path.getByRole('button', { name: /Leave school/ }) as HTMLButtonElement
  expect(leave.disabled).toBe(true)
  expect(leave.textContent).toContain('You can leave school once SMP is finished.')
})

it('takes a job from the job board, and the rail shows it', async () => {
  await start(adult(), 'Work')
  const path = within(screen.getByRole('region', { name: 'Your path' }))
  expect(path.getByText('No job yet')).toBeTruthy()
  await userEvent.click(path.getByRole('button', { name: /^Job board/ }))
  const board = within(screen.getByRole('dialog', { name: /^Job board/ }))
  await userEvent.click(board.getByRole('button', { name: /Shop work/ }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(useApp.getState().life!.job?.careerId).toBeTruthy()
  expect(within(screen.getByRole('complementary')).getByText('Warung helper')).toBeTruthy()
})

it('asks before replacing a job', async () => {
  await start(adult({ job: { careerId: 'shop', step: 0, performance: 50, years: 0 } }), 'Work')
  await userEvent.click(screen.getByRole('button', { name: /^Job board/ }))
  await userEvent.click(within(screen.getByRole('dialog', { name: /^Job board/ })).getByRole('button', { name: /Office/ }))
  const ask = screen.getByRole('dialog', { name: /Take the job as Office clerk\?/ })
  await userEvent.click(within(ask).getByRole('button', { name: 'Keep my job' }))
  expect(useApp.getState().life!.job?.careerId).toBe('shop')
  await userEvent.click(within(screen.getByRole('dialog', { name: /^Job board/ })).getByRole('button', { name: /Office/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Take the job' }))
  expect(useApp.getState().life!.job?.careerId).toBe('office')
})

it('keeps the sheet on Escape and ignores number keys while the board is open, then returns focus', async () => {
  await start(adult(), 'Work')
  const button = screen.getByRole('button', { name: /^Job board/ })
  await userEvent.click(button)
  await userEvent.keyboard('2')
  expect(useApp.getState().openCategory).toBe('school')
  await userEvent.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(useApp.getState().openCategory).toBe('school')
  expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Job board/ }))
})

it('shows job performance, and "No job" for an adult without one', async () => {
  await start(adult({ job: { careerId: 'office', step: 0, performance: 30, years: 0 } }), 'Work')
  expect(screen.getByText('Office clerk · performance 30')).toBeTruthy()
  act(() => useApp.setState({ life: adult({ age: 30 }) }))
  expect(screen.getByText('No job')).toBeTruthy()
})

it('moves focus to the status line after taking a move', async () => {
  await start(adult(), 'Work')
  await userEvent.click(screen.getByRole('button', { name: /^Job board/ }))
  await userEvent.click(within(screen.getByRole('dialog', { name: /^Job board/ })).getByRole('button', { name: /Shop work/ }))
  await userEvent.click(within(screen.getByRole('region', { name: 'Your path' })).getByRole('button', { name: /Quit your job/ }))
  expect(document.activeElement).toBe(within(screen.getByRole('region', { name: 'Your path' })).getByText('No job yet').closest('p'))
})

it('closes only the confirm on Escape, not the whole job board', async () => {
  await start(adult({ job: { careerId: 'shop', step: 0, performance: 50, years: 0 } }), 'Work')
  await userEvent.click(screen.getByRole('button', { name: /^Job board/ }))
  await userEvent.click(within(screen.getByRole('dialog', { name: /^Job board/ })).getByRole('button', { name: /Office/ }))
  await userEvent.keyboard('{Escape}')
  expect(useApp.getState().jobBoardOpen).toBe(true)
  expect(useApp.getState().life!.job?.careerId).toBe('shop')
})

it('does not bring the job board back after Title and Continue', async () => {
  await start(adult(), 'Work')
  await userEvent.click(screen.getByRole('button', { name: /^Job board/ }))
  act(() => useApp.getState().goTitle())
  expect(useApp.getState().jobBoardOpen).toBe(false)
})
