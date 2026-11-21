import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { useApp } from '../app/store'
import { gameClock } from '../engine/clock'
import { createSaves } from '../engine/save/saves'
import { memoryStore } from '../engine/save/storage'
import { useSettings } from '../engine/settings'
import { testLife } from '../life/testLife'
import { MinigameHost } from './Host'

const begin = async (id = 'futsal') => {
  useSettings.getState().update({ reducedMotion: 'on' })
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(createSaves(memoryStore()))
  useApp.setState({ life: testLife() })
  useApp.getState().begin(id)
  render(<MinigameHost />)
}
const frame = (ms: number) => act(() => gameClock.tick(ms))

it('stops on Space, applies the result once and offers the way back', async () => {
  await begin()
  frame(0)
  frame(50) // let the marker leave the exact middle
  fireEvent.keyDown(window, { code: 'Space' })
  frame(60) // it stops at about 0.55: a near miss
  expect(useApp.getState().lastResult!.tier).toBe('weak')
  const health = useApp.getState().life!.stats.health
  fireEvent.keyDown(window, { code: 'Space' })
  frame(100)
  expect(useApp.getState().life!.stats.health).toBe(health)
  expect(screen.getByRole('button', { name: 'Back to your year' })).toBeTruthy()
  expect(screen.getByText('Saved')).toBeTruthy() // the futsal word for a Weak result
})
it('can be skipped for a weak result', async () => {
  await begin('jog')
  await userEvent.click(screen.getByRole('button', { name: 'Skip for a weaker result' }))
  expect(useApp.getState().lastResult!.tier).toBe('weak')
})
it('pauses when the window loses focus', async () => {
  await begin()
  fireEvent.blur(window)
  expect(gameClock.paused).toBe(true)
  fireEvent.focus(window)
  expect(gameClock.paused).toBe(false)
})
it('keeps the game going when the skin changes', async () => {
  await begin()
  frame(0)
  frame(100)
  const before = screen.getByTestId('marker').style.left
  act(() => useSettings.getState().update({ style: 'pixel' }))
  expect(screen.getByTestId('marker').style.left).toBe(before)
  expect(useApp.getState().lastResult).toBeNull()
})
it('does not take a shot on coming back to the window', async () => {
  await begin()
  frame(0)
  frame(50)
  fireEvent.blur(window)
  fireEvent.pointerDown(screen.getByRole('dialog').querySelector(':scope > div')!)
  frame(60)
  fireEvent.focus(window)
  frame(70)
  frame(100)
  expect(useApp.getState().lastResult).toBeNull()
  fireEvent.keyDown(window, { code: 'Space' }) // still inside the 250 ms after coming back
  frame(200)
  frame(300)
  expect(useApp.getState().lastResult).toBeNull()
  frame(400)
  fireEvent.keyDown(window, { code: 'Space' })
  frame(410)
  expect(useApp.getState().lastResult).not.toBeNull()
})
it('announces the result only once, through the journal', async () => {
  await begin('jog')
  await userEvent.click(screen.getByRole('button', { name: 'Skip for a weaker result' }))
  expect(screen.getByRole('dialog').querySelector('[aria-live]')).toBeNull()
})
it('stops the clock it started when the game closes', async () => {
  await begin()
  expect(gameClock.running).toBe(true)
  act(() => useApp.getState().finish(0.6))
  act(() => useApp.getState().closeResult())
  expect(gameClock.running).toBe(false)
})
