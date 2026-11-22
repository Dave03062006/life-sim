import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { App } from '../app/App'
import { useApp } from '../app/store'
import { createSaves } from '../engine/save/saves'
import { memoryStore } from '../engine/save/storage'
import { rollLife, WEALTH_LABEL } from '../life/roll'
import { STAT_LABEL } from '../life/stats'
import { testLife } from '../life/testLife'
import type { Life } from '../life/types'
import { newLife } from '../life/year'
import { relationLabel } from './year/labels'

const open = async (active: Life | null = null) => {
  const saves = createSaves(memoryStore())
  await saves.store({ version: 5, active, past: [] })
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(saves)
  render(<App />)
  act(() => useApp.getState().newRoll(3))
}

it('shows who you will be: country, name, gender, city, wealth, family and stats', async () => {
  await open()
  const roll = rollLife(3)
  const preview = newLife({ ...roll, startAge: 0 })
  const country = screen.getByRole('combobox', { name: 'Country' }) as HTMLSelectElement
  expect(country.value).toBe('indonesia')
  expect(within(country).getByRole('option', { name: 'Indonesia' })).toBeTruthy()
  const name = screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement
  expect([name.value, name.maxLength]).toEqual([roll.name, 40])
  expect(screen.getByRole('button', { name: roll.gender === 'female' ? 'Female' : 'Male' }).getAttribute('aria-pressed')).toBe('true')
  expect(screen.getByText(roll.city)).toBeTruthy()
  expect(screen.getByText(WEALTH_LABEL[roll.wealth])).toBeTruthy()
  for (const p of preview.people.filter((p) => p.name !== roll.name)) expect(screen.getByText(`${p.name}, ${relationLabel(p).toLowerCase()}`)).toBeTruthy()
  for (const [stat, value] of Object.entries(preview.stats)) {
    const label = STAT_LABEL[stat as keyof typeof STAT_LABEL]
    expect(screen.getByRole('meter', { name: label }).getAttribute('aria-valuenow')).toBe(String(value))
  }
  expect(screen.getByRole('button', { name: 'Re-roll' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Start' })).toBeTruthy()
})

it('previews the edits, as Start will make them', async () => {
  await open()
  const other = rollLife(3).gender === 'female' ? 'male' : 'female'
  await userEvent.click(screen.getByRole('button', { name: other === 'female' ? 'Female' : 'Male' }))
  expect(useApp.getState().roll!.gender).toBe(other)
  const preview = newLife({ ...rollLife(3), gender: other, startAge: 0 })
  expect(screen.getByRole('meter', { name: 'Health' }).getAttribute('aria-valuenow')).toBe(String(preview.stats.health))
  await userEvent.click(screen.getByRole('button', { name: 'Re-roll' }))
  expect(useApp.getState().roll!.seed).not.toBe(3)
})

it('will not start with an empty name, and says why', async () => {
  await open()
  const name = screen.getByRole('textbox', { name: 'Name' })
  await userEvent.clear(name)
  await userEvent.type(name, '   ')
  const start = screen.getByRole('button', { name: 'Start' }) as HTMLButtonElement
  expect(start.disabled).toBe(true)
  expect(start.getAttribute('aria-describedby')).toBeTruthy()
  expect(document.getElementById(start.getAttribute('aria-describedby')!)!.textContent).toBe("Your name can't be empty.")
})

it('starts the life', async () => {
  await open()
  await userEvent.click(screen.getByRole('button', { name: 'Start' }))
  expect(useApp.getState()).toMatchObject({ screen: 'year', life: { age: 0, name: rollLife(3).name } })
})

it('asks before replacing an unfinished life, with focus on keeping it', async () => {
  await open(testLife())
  await userEvent.click(screen.getByRole('button', { name: 'Start' }))
  const dialog = screen.getByRole('dialog', { name: 'Start a new life?' })
  expect(within(dialog).getByText('Raka Pratama, aged 16, moves to Past lives as unfinished.')).toBeTruthy()
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Keep playing' }))
  await userEvent.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(useApp.getState()).toMatchObject({ screen: 'new-life', confirmAbandon: false })
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Start' }))
  await userEvent.click(screen.getByRole('button', { name: 'Start' }))
  await userEvent.click(screen.getByRole('button', { name: 'Start new life' }))
  expect(useApp.getState().past.map((l) => l.id)).toEqual(['life-test'])
  expect(useApp.getState().screen).toBe('year')
})

it('goes back to the title with Escape, even from the name field', async () => {
  await open()
  await userEvent.click(screen.getByRole('textbox', { name: 'Name' }))
  await userEvent.keyboard('{Escape}')
  expect(useApp.getState().screen).toBe('title')
})

it('goes back to the title with the Back button, keeping the active life', async () => {
  await open(testLife())
  await userEvent.click(screen.getByRole('button', { name: 'Back' }))
  expect(useApp.getState()).toMatchObject({ screen: 'title', roll: null })
  expect(useApp.getState().life!.id).toBe('life-test')
})
