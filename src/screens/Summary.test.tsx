import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { App } from '../app/App'
import { useApp } from '../app/store'
import { createSaves } from '../engine/save/saves'
import { memoryStore } from '../engine/save/storage'
import { summaryOf } from '../life/summary'
import { testLife } from '../life/testLife'
import type { Life } from '../life/types'

const dead = testLife({
  id: 'dead',
  name: 'Sari Dewi',
  age: 74,
  money: 1500000,
  death: { age: 74, cause: 'Old age' },
  memories: [
    { id: 'trip', age: 15, text: 'You stood up for Dimas on the class trip.', people: [] },
    { id: 'drawing', age: 9, text: 'You won the drawing contest.', people: [] },
  ],
})
const unfinished = testLife({ id: 'unfinished', name: 'Raka Pratama' })

const boot = async (past: Life[]) => {
  const saves = createSaves(memoryStore())
  await saves.store({ version: 5, active: null, past })
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(saves)
  render(<App />)
}

it('sums up a life that ended', async () => {
  await boot([dead])
  useApp.getState().showSummary('dead')
  expect(await screen.findByRole('heading', { name: 'Sari Dewi' })).toBeTruthy()
  expect(screen.getByText('Lived 74 years')).toBeTruthy()
  expect(screen.getByText('Old age')).toBeTruthy()
  expect(screen.getByRole('img', { name: 'You stood up for Dimas on the class trip.' })).toBeTruthy()
  const memories = within(screen.getByRole('list', { name: 'Memories' }))
  expect(memories.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Age 9: You won the drawing contest.', 'Age 15: You stood up for Dimas on the class trip.'])
  expect(screen.getByRole('meter', { name: 'Health' }).getAttribute('aria-valuenow')).toBe('58')
  expect(screen.getByText('Rp 1.500.000')).toBeTruthy()
  const people = within(screen.getByRole('list', { name: 'Left behind' }))
  expect(people.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Siti, mother', 'Budi, father', 'Dimas, friend'])
  expect(screen.getByText(summaryOf(dead).closing)).toBeTruthy()
  await userEvent.click(screen.getByRole('button', { name: 'Past lives' }))
  expect(useApp.getState().screen).toBe('past')
})

it('says how far an unfinished life got, and New life opens the roll', async () => {
  await boot([unfinished])
  useApp.getState().showSummary('unfinished')
  expect(await screen.findByText('16 years so far')).toBeTruthy()
  expect(screen.getByText('Unfinished')).toBeTruthy()
  await userEvent.click(screen.getByRole('button', { name: 'New life' }))
  expect(useApp.getState().screen).toBe('new-life')
})

it('lists past lives newest first, each opening its summary, and Back goes to the title', async () => {
  await boot([dead, unfinished])
  await userEvent.click(screen.getByRole('button', { name: 'Past lives (2)' }))
  const rows = screen.getAllByRole('button', { name: /years/ })
  expect(rows).toEqual([screen.getByRole('button', { name: 'Raka Pratama, 16 years, Unfinished' }), screen.getByRole('button', { name: 'Sari Dewi, 74 years, Old age' })])
  await userEvent.click(rows[1]!)
  expect(useApp.getState()).toMatchObject({ screen: 'summary', summaryId: 'dead' })
  useApp.getState().showPast()
  await userEvent.click(await screen.findByRole('button', { name: 'Back' }))
  expect(useApp.getState().screen).toBe('title')
})
