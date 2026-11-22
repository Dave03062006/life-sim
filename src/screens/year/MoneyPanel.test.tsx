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

const start = async (life: Life) => {
  useSettings.getState().update({ reducedMotion: 'on' })
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(createSaves(memoryStore()))
  render(<App />)
  act(() => useApp.setState({ life, screen: 'year' }))
  await userEvent.click(screen.getByRole('button', { name: 'Money' }))
}
const grown = (over: Partial<Life> = {}) => testLife({ age: 26, ownWay: true, ...over })

it('switches lifestyle', async () => {
  await start(grown())
  await userEvent.click(within(screen.getByRole('group', { name: 'Lifestyle' })).getByRole('radio', { name: /frugal/i }))
  expect(useApp.getState().life!.lifestyle).toBe('frugal')
})

it('sells a motorbike for its resale value', async () => {
  await start(grown({ belongings: ['motorbike'], money: 1_000_000 }))
  await userEvent.click(screen.getByRole('button', { name: 'Sell for Rp 5.500.000' }))
  expect(useApp.getState().life).toMatchObject({ money: 6_500_000, belongings: [] })
  expect(screen.getByText("You don't own anything big yet.")).toBeTruthy()
})

it('says why a sale is blocked', async () => {
  await start(grown({ belongings: ['motorbike'], job: { careerId: 'driving', step: 0, performance: 50, years: 0 } }))
  const sell = screen.getByRole('button', { name: /Sell for/ }) as HTMLButtonElement
  expect(sell.disabled).toBe(true)
  expect(screen.getByText(/needs it. Quit first/)).toBeTruthy()
})

it('says you live with your family before your own way', async () => {
  await start(testLife({ age: 20, ownWay: false }))
  expect(screen.getByText('You live with your family. Costs start with your first full-time job or at 25.')).toBeTruthy()
  expect(screen.queryByRole('group', { name: 'Lifestyle' })).toBeNull()
})
