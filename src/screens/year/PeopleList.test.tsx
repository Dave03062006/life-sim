import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { App } from '../../app/App'
import { useApp } from '../../app/store'
import { createSaves } from '../../engine/save/saves'
import { memoryStore } from '../../engine/save/storage'
import { useSettings } from '../../engine/settings'
import { testLife } from '../../life/testLife'
import type { Person } from '../../life/types'

const family: Person[] = [
  { id: 'p-4', name: 'Rina', relation: 'sibling', gender: 'female', age: 12, closeness: 50 },
  { id: 'p-5', name: 'Hadi', relation: 'grandparent', gender: 'male', age: 70, closeness: 40 },
  { id: 'p-6', name: 'Ayu', relation: 'crush', gender: 'female', age: 16, closeness: 30 },
]
const start = async (life = testLife()) => {
  useSettings.getState().update({ reducedMotion: 'on' })
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(createSaves(memoryStore()))
  render(<App />)
  act(() => useApp.setState({ life, screen: 'year' }))
  await userEvent.click(screen.getByRole('button', { name: 'People' }))
}

it('lists people with closeness and their actions', async () => {
  await start(testLife({ people: [...testLife().people, ...family] }))
  const people = within(screen.getByRole('region', { name: 'Your people' }))
  const meter = people.getByRole('meter', { name: 'Dimas' })
  expect(meter.getAttribute('aria-valuenow')).toBe('60')
  for (const [name, relation] of [['Siti', 'Mother'], ['Budi', 'Father'], ['Dimas', 'Friend'], ['Rina', 'Sister'], ['Hadi', 'Grandfather'], ['Ayu', 'Crush']]) {
    expect(people.getByRole('button', { name: new RegExp(`^${name}`) }).textContent).toContain(relation)
  }
  expect(people.getByRole('button', { name: /^Hadi/ }).textContent).toContain('70')
  expect(people.queryByRole('button', { name: 'Spend time' })).toBeNull()
  await userEvent.click(people.getByRole('button', { name: /^Dimas/ }))
  expect(people.getByRole('button', { name: /^Dimas/ }).getAttribute('aria-pressed')).toBe('true')
  for (const name of [/Spend time/, /Talk/, /Give a gift/]) expect(people.getByRole('button', { name })).toBeTruthy()
  expect(people.getByRole('button', { name: /Give a gift/ }).textContent).toContain('Rp 50.000')
  for (const name of [/Spend time/, /Talk/]) expect(people.getByRole('button', { name }).textContent).toContain('1 energy')
  expect((people.getByRole('button', { name: /Talk/ }) as HTMLButtonElement).disabled).toBe(false) // the pack now has a talk event
  expect(people.queryByRole('button', { name: /Ask out/ })).toBeNull()
  await userEvent.click(people.getByRole('button', { name: /^Ayu/ }))
  expect(people.getByRole('button', { name: /Ask out/ })).toBeTruthy()
})

it('gives a gift and says so in the list', async () => {
  await start()
  const people = within(screen.getByRole('region', { name: 'Your people' }))
  await userEvent.click(people.getByRole('button', { name: /^Dimas/ }))
  await userEvent.click(people.getByRole('button', { name: /Give a gift/ }))
  const status = people.getByRole('status')
  expect(status.textContent).toContain('You gave Dimas a gift.')
  expect(within(status).getByText('Dimas +10').className).toBe('chg up')
  expect(people.getByRole('meter', { name: 'Dimas' }).getAttribute('aria-valuenow')).toBe('70')
  expect(useApp.getState().life!.money).toBe(165000)
  expect(screen.getByText('You gave Dimas a gift.', { selector: '.journal .e' })).toBeTruthy()
})

it('blocks a gift you cannot afford', async () => {
  await start(testLife({ money: 10000 }))
  const people = within(screen.getByRole('region', { name: 'Your people' }))
  await userEvent.click(people.getByRole('button', { name: /^Dimas/ }))
  const gift = people.getByRole('button', { name: /Give a gift/ }) as HTMLButtonElement
  expect(gift.disabled).toBe(true)
  expect(gift.textContent).toContain('You need Rp 50.000. You have Rp 10.000.')
})

it('shows closeness won in a mini-game result', async () => {
  await start()
  const people = within(screen.getByRole('region', { name: 'Your people' }))
  await userEvent.click(people.getByRole('button', { name: /^Dimas/ }))
  await userEvent.click(people.getByRole('button', { name: /Spend time/ }))
  expect(useApp.getState().playing!.personId).toBe('p-3')
  act(() => useApp.getState().finish(0.9))
  expect(screen.getByText('Dimas +12', { selector: '.res .chg' }).className).toBe('chg up')
})

it('warns that spending time or talking will overwork you', async () => {
  await start(testLife({ energySpent: 10 }))
  const people = within(screen.getByRole('region', { name: 'Your people' }))
  await userEvent.click(people.getByRole('button', { name: /^Dimas/ }))
  for (const name of [/Spend time/, /Talk/]) expect(people.getByRole('button', { name }).textContent).toContain('1 energy · overwork')
})
