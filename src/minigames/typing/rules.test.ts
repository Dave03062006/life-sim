import { describe, expect, it } from 'vitest'
import { NO_MODIFIERS, type GameInput } from '../framework'
import { typing, type TypingState } from './rules'

const text = (t: string): GameInput => ({ kind: 'text', text: t })
const type = (s: TypingState, chars: string) => {
  for (const ch of chars) s = typing.step(s, [text(ch)])
  return s
}
const idle = (s: TypingState, steps: number) => {
  for (let i = 0; i < steps && !typing.done(s); i++) s = typing.step(s, [])
  return s
}

describe('typing', () => {
  it('scores exact typing as 1 and ends when the text is complete', () => {
    const s0 = typing.start(NO_MODIFIERS, 2, 'homework')
    const s = type(s0, typing.view(s0).target)
    expect([typing.done(s), typing.score(s)]).toEqual([true, 1])
  })
  it('lets Backspace fix a mistake', () => {
    const s0 = typing.start(NO_MODIFIERS, 2, 'homework')
    const target = typing.view(s0).target
    const wrong = target[0] === 'x' ? 'y' : 'x'
    let s = type(s0, wrong)
    expect(typing.view(s).typed).toBe(wrong)
    s = type(typing.step(s, [text('\b')]), target)
    expect(typing.score(s)).toBe(1)
  })
  it('scores half the text, all correct, as 0.5', () => {
    const s0 = typing.start(NO_MODIFIERS, 2, 'homework')
    const target = typing.view(s0).target
    const s = idle(type(s0, target.slice(0, target.length / 2)), 20 * 120 + 5)
    expect(typing.done(s)).toBe(true)
    expect(Math.abs(typing.score(s) - 0.5)).toBeLessThan(0.05)
  })
  it('ends by itself after 20 seconds', () => {
    let s = typing.start(NO_MODIFIERS, 2, 'homework')
    for (let i = 0; i < 20 * 120 - 1; i++) s = typing.step(s, [])
    expect(typing.done(s)).toBe(false)
    s = typing.step(s, [])
    expect([typing.done(s), typing.score(s)]).toEqual([true, 0])
  })
  it('draws 5 different words and ignores extra characters and empty Backspace', () => {
    const s0 = typing.start(NO_MODIFIERS, 9, 'diary')
    const words = typing.view(s0).target.split(' ')
    expect(new Set(words).size).toBe(5)
    expect(typing.view(typing.step(s0, [text('\b')])).typed).toBe('')
    const s = type(type(s0, typing.view(s0).target), 'zzz')
    expect(typing.view(s).typed).toBe(typing.view(s0).target)
  })
})
