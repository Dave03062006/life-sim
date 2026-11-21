import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { App } from '../../app/App'
import { useApp } from '../../app/store'
import type { EventAction, EventDef } from '../../content/types'
import { createSaves } from '../../engine/save/saves'
import { memoryStore } from '../../engine/save/storage'
import { useSettings } from '../../engine/settings'
import { testLife } from '../../life/testLife'

const events = vi.hoisted(() => [] as EventDef[])
vi.mock('../../content', async (orig) => {
  const real = await orig<typeof import('../../content')>()
  return { packFor: (country: 'indonesia') => ({ ...real.packFor(country), events }) }
})
const same = (text: string, closeness?: Record<string, number>): EventAction['outcomes'] => ({
  success: { text, closeness }, mixed: { text, closeness }, fail: { text, closeness },
})
const trip: EventDef = {
  id: 'class-trip', kind: 'choice', stages: ['late-teen'], weight: 1, cast: { friend: 'friend' },
  title: 'The class trip money is missing', text: 'People are looking at {friend}.',
  actions: [
    { id: 'tell', label: 'Tell the teacher', chance: 100, outcomes: same('You told the teacher.') },
    { id: 'ask', label: 'Ask {friend} first', chance: 100, outcomes: same('You and {friend} talked it out.', { friend: 4 }) },
    { id: 'speak', label: 'Speak up for {friend}', chance: 100, open: { condition: { kind: 'stat', key: 'reputation', min: 60 }, note: 'Open to you: Reputation 60+' }, outcomes: same('People listened.') },
  ],
}
const second: EventDef = { ...trip, id: 'second', cast: {}, title: 'Another thing', text: 'Something else.', actions: [trip.actions![0]!] }

const start = async (life = testLife({ pendingEvents: [{ eventId: 'class-trip', cast: { friend: 'p-3' } }] })) => {
  events.splice(0, events.length, trip, second)
  useSettings.getState().update({ reducedMotion: 'on' })
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(createSaves(memoryStore()))
  render(<App />)
  act(() => useApp.setState({ life, pendingEvent: life.pendingEvents[0] ?? null }))
}
const pressed = (name: string | RegExp) => screen.getByRole('button', { name }).getAttribute('aria-pressed')

it('answers an event with a what and a how', async () => {
  await start()
  expect(screen.getByRole('dialog', { name: 'The class trip money is missing' })).toBeTruthy()
  expect(screen.getByText('People are looking at Dimas.')).toBeTruthy()
  expect(document.querySelector('.app')!.hasAttribute('inert')).toBe(true)
  expect(pressed(/Tell the teacher/)).toBe('true')
  expect(pressed('Calmly')).toBe('true')
  await userEvent.click(screen.getByRole('button', { name: 'Ask Dimas first' }))
  await userEvent.click(screen.getByRole('button', { name: 'Bluntly' }))
  expect(pressed('Ask Dimas first')).toBe('true')
  expect(pressed(/Tell the teacher/)).toBe('false')
  expect(pressed('Bluntly')).toBe('true')
  await userEvent.click(screen.getByRole('button', { name: 'Decide' }))
  expect(screen.getByText('You and Dimas talked it out.', { selector: '.res' })).toBeTruthy()
  expect(screen.getByText('Dimas +6', { selector: '.res .chg' }).className).toBe('chg up') // 4 scaled by Bluntly
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Back to your year' }))
  await userEvent.click(screen.getByRole('button', { name: 'Back to your year' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.querySelector('.app')!.hasAttribute('inert')).toBe(false)
  expect(document.activeElement).toBe(screen.getByRole('button', { name: /Turn 17/ }))
})

it('marks options open only to you', async () => {
  await start()
  const speak = screen.getByRole('button', { name: /Speak up for Dimas/ })
  expect(speak.querySelector('small')!.textContent).toBe('Open to you: Reputation 60+')
  act(() => useApp.setState({ life: { ...useApp.getState().life!, stats: { ...useApp.getState().life!.stats, reputation: 40 } } }))
  expect(screen.queryByRole('button', { name: /Speak up for Dimas/ })).toBeNull()
})

it('plays an event by keyboard alone', async () => {
  await start(testLife({ pendingEvents: [{ eventId: 'class-trip', cast: { friend: 'p-3' } }, { eventId: 'second', cast: {} }] }))
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Tell the teacher' }))
  await userEvent.keyboard('3')
  expect(pressed(/Speak up for Dimas/)).toBe('true')
  await userEvent.keyboard('2')
  expect(pressed('Ask Dimas first')).toBe('true')
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Ask Dimas first' }))
  expect(useApp.getState().openCategory).toBeNull() // digits are the dialog's, not the dock's
  await userEvent.tab()
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Calmly' }))
  await userEvent.keyboard('{ArrowRight}')
  expect(pressed('Bluntly')).toBe('true')
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Bluntly' }))
  await userEvent.keyboard('{Enter}')
  expect(screen.getByText('Dimas +6', { selector: '.res .chg' })).toBeTruthy()
  await userEvent.keyboard('{Enter}') // Back to your year has focus
  expect(screen.getByRole('dialog', { name: 'Another thing' })).toBeTruthy()
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Tell the teacher' }))
  await userEvent.keyboard('{Enter}')
  await userEvent.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(screen.getByRole('button', { name: /Turn 17/ }))
})

it('shows the event banner when there is art for it', async () => {
  await start(testLife({ pendingEvents: [{ eventId: 'class-trip', cast: { friend: 'p-3' } }] }))
  expect(document.querySelectorAll('.banner img')).toHaveLength(2)
  await userEvent.click(screen.getByRole('button', { name: 'Decide' }))
  await userEvent.click(screen.getByRole('button', { name: 'Back to your year' }))
  act(() => useApp.setState({ life: testLife({ pendingEvents: [{ eventId: 'second', cast: {} }] }), pendingEvent: { eventId: 'second', cast: {} } }))
  expect(document.querySelector('.banner')).toBeNull()
})

it('asks who you are interested in, and lets Settings change it', async () => {
  await start(testLife())
  act(() => useApp.setState({ askingInterest: true }))
  expect(screen.getByRole('dialog', { name: 'Who are you interested in?' })).toBeTruthy()
  expect(document.querySelector('.app')!.hasAttribute('inert')).toBe(true)
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Women' }))
  for (const name of ['Men', 'Both', 'Nobody yet']) expect(screen.getByRole('button', { name })).toBeTruthy()
  await userEvent.click(screen.getByRole('button', { name: 'Both' }))
  expect(useApp.getState()).toMatchObject({ askingInterest: false, life: { interest: 'both' } })
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(screen.getByRole('button', { name: /Turn 17/ }))

  await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
  const select = screen.getByRole('combobox', { name: 'Romantic interest' }) as HTMLSelectElement
  expect(select.value).toBe('both')
  await userEvent.selectOptions(select, 'Nobody yet')
  expect(useApp.getState().life!.interest).toBe('none')
})

it('says the romance question is not asked yet in Settings', async () => {
  await start(testLife())
  await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
  const select = screen.getByRole('combobox', { name: 'Romantic interest' }) as HTMLSelectElement
  expect(select.selectedOptions[0]!.textContent).toBe('Not asked yet')
  await userEvent.selectOptions(select, 'Men')
  expect(useApp.getState().life!.interest).toBe('men')
  expect(screen.queryByRole('option', { name: 'Not asked yet' })).toBeNull()
})
