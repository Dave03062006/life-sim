import { describe, expect, it } from 'vitest'
import { NO_MODIFIERS } from '../framework'
import { timing } from './rules'

const stopAfter = (steps: number, mods = NO_MODIFIERS) => {
  let s = timing.start(mods, 1)
  for (let i = 0; i < steps; i++) s = timing.step(s, [])
  return timing.step(s, [{ kind: 'key', key: 'primary', down: true }])
}

describe('timing', () => {
  it('scores by where the marker stops', () => {
    expect(timing.score(stopAfter(19))).toBe(1)
    expect(timing.score(stopAfter(13))).toBe(0.7)
    expect(timing.score(stopAfter(6))).toBe(0.4)
    expect(timing.score(stopAfter(60))).toBe(0)
    expect(timing.done(stopAfter(19))).toBe(true)
    expect(timing.done(timing.start(NO_MODIFIERS, 1))).toBe(false)
  })
  it('narrows the zone when the window shrinks', () => {
    expect(timing.score(stopAfter(9))).toBe(0.7)
    expect(timing.score(stopAfter(9, { ...NO_MODIFIERS, window: 0.9 }))).toBe(0.4)
  })
  it('wobbles, and a pointer press also stops it', () => {
    const steady = timing.view(stopAfter(19)).marker
    expect(timing.view(stopAfter(19, { ...NO_MODIFIERS, wobble: 1 })).marker).not.toBe(steady)
    const s = timing.step(timing.start(NO_MODIFIERS, 1), [{ kind: 'pointer', phase: 'down', x: 0.5, y: 0.5 }])
    expect(timing.done(s)).toBe(true)
  })
  it('ends by itself after twelve seconds', () => {
    let s = timing.start(NO_MODIFIERS, 1)
    for (let i = 0; i < 12 * 120 + 1; i++) s = timing.step(s, [])
    expect(timing.done(s)).toBe(true)
  })
  it('is frozen once stopped and scores 0 before', () => {
    const s = stopAfter(19)
    expect(timing.step(s, [])).toBe(s)
    expect(timing.score(timing.start(NO_MODIFIERS, 1))).toBe(0)
  })
})
