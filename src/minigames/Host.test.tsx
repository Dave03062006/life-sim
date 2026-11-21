import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { installKeys } from '../app/keys'
import { useApp } from '../app/store'
import { gameClock } from '../engine/clock'
import { createSaves } from '../engine/save/saves'
import { memoryStore } from '../engine/save/storage'
import { useSettings } from '../engine/settings'
import { testLife } from '../life/testLife'
import { MinigameHost } from './Host'
import { GAMES } from './registry'
import { timing } from './timing/rules'
import { typing } from './typing/rules'

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
it('sends 1–4 as choices and passes the seed and theme to the rules', async () => {
  const spyRules = { ...timing, start: vi.fn<typeof timing.start>(timing.start), step: vi.fn<typeof timing.step>(timing.step) }
  const real = GAMES.quiz
  GAMES.quiz = { rules: spyRules, View: () => null, instruction: 'Test instruction here', verb: 'Go' }
  try {
    await begin('study-exam')
    const { mods, seed } = useApp.getState().playing!
    fireEvent.keyDown(window, { code: 'Digit2', key: '2' })
    frame(0)
    frame(20)
    expect(spyRules.start).toHaveBeenCalledWith(mods, seed, 'study-exam')
    expect(spyRules.step).toHaveBeenCalledWith(expect.anything(), [{ kind: 'choose', option: 1 }])
  } finally {
    GAMES.quiz = real
  }
})
it('sends printable keys and Backspace as text in a text game', async () => {
  const spyRules = { ...timing, input: 'text' as const, step: vi.fn<typeof timing.step>(timing.step) }
  const real = GAMES.typing
  GAMES.typing = { rules: spyRules, View: () => null, instruction: 'Test instruction here' }
  try {
    await begin('homework')
    frame(0)
    fireEvent.keyDown(window, { code: 'Digit1', key: '1' })
    fireEvent.keyDown(window, { code: 'Space', key: ' ' })
    fireEvent.keyDown(window, { code: 'Backspace', key: 'Backspace' })
    fireEvent.keyDown(window, { code: 'ShiftLeft', key: 'Shift' })
    frame(20)
    expect(spyRules.step).toHaveBeenCalledWith(expect.anything(), ['1', ' ', '\b'].map((text) => ({ kind: 'text', text })))
    expect(screen.queryByRole('button', { name: /Space/ })).toBeNull() // no verb, no play button
  } finally {
    GAMES.typing = real
  }
})
it('sends Space and digits as text in Typing and keeps the year screen keys quiet', async () => {
  const spyRules = { ...typing, step: vi.fn<typeof typing.step>(typing.step) }
  const real = GAMES.typing
  GAMES.typing = { ...real, rules: spyRules }
  const remove = installKeys()
  try {
    await begin('homework')
    frame(0)
    fireEvent.keyDown(window, { code: 'Space', key: ' ' })
    fireEvent.keyDown(window, { code: 'Digit3', key: '3' })
    frame(20)
    expect(spyRules.step).toHaveBeenCalledWith(expect.anything(), [' ', '3'].map((text) => ({ kind: 'text', text })))
    expect(useApp.getState().openCategory).toBeNull()
  } finally {
    remove()
    GAMES.typing = real
  }
})
it('measures the pointer over the pitch, not the wider wrapper', async () => {
  await begin()
  frame(0)
  const step = vi.spyOn(timing, 'step')
  const wrapper = screen.getByRole('dialog').querySelector(':scope > div')!
  wrapper.querySelector('.pitch')!.getBoundingClientRect = () => ({ left: 100, width: 200, top: 0, height: 100 }) as DOMRect
  wrapper.getBoundingClientRect = () => ({ left: 0, width: 400, top: 0, height: 100 }) as DOMRect
  fireEvent.pointerDown(wrapper, { clientX: 100, clientY: 0 })
  fireEvent.pointerMove(wrapper, { clientX: 300, clientY: 0 })
  frame(20)
  const xs = step.mock.calls.flatMap(([, inputs]) => inputs.flatMap((i) => (i.kind === 'pointer' ? [i.x] : [])))
  expect(xs).toEqual([0, 1])
  step.mockRestore()
})
it('releases held keys when the window blurs, even if the key-up happens elsewhere', async () => {
  await begin('eat-better')
  const x = () => screen.getByTestId('basket').style.left
  frame(0)
  fireEvent.keyDown(window, { code: 'ArrowRight' })
  frame(50)
  frame(50)
  fireEvent.blur(window)
  fireEvent.focus(window)
  frame(100)
  frame(300) // past the resume grace
  const rest = x()
  frame(100)
  frame(100)
  expect(x()).toBe(rest)
})
it('leaves keys to Settings controls while Settings is open', async () => {
  await begin('eat-better')
  frame(0)
  act(() => useApp.getState().setSettingsOpen(true))
  const box = document.body.appendChild(document.createElement('input'))
  box.type = 'checkbox'
  expect(fireEvent.keyDown(box, { code: 'Space', key: ' ' })).toBe(true) // true = not default-prevented
  box.remove()
})
