import { describe, expect, it } from 'vitest'
import { NO_MODIFIERS, type GameInput } from '../framework'
import { quiz, type QuizState } from './rules'

const pause = (s: QuizState) => {
  for (let i = 0; i < 0.6 * 120 + 1; i++) s = quiz.step(s, [])
  return s
}
const answer = (s: QuizState, right: boolean) => {
  const v = quiz.view(s)
  const option = right ? v.correct : (v.correct + 1) % v.choices.length
  return pause(quiz.step(s, [{ kind: 'choose', option }]))
}

describe('quiz', () => {
  it('scores right answers and a little speed', () => {
    let s = quiz.start(NO_MODIFIERS, 5, 'study-exam')
    for (let i = 0; i < 5; i++) s = answer(s, true)
    expect(quiz.done(s)).toBe(true)
    expect(quiz.score(s)).toBeGreaterThanOrEqual(0.9)
    expect(quiz.score(s)).toBeLessThanOrEqual(1)
  })
  it('scores only the right answers among mixed ones', () => {
    let s = quiz.start(NO_MODIFIERS, 5, 'study-exam')
    for (let i = 0; i < 5; i++) s = answer(s, i < 2)
    expect(quiz.done(s)).toBe(true)
    expect(quiz.score(s)).toBeGreaterThan((0.9 * 2) / 5)
    expect(quiz.score(s)).toBeLessThan((0.9 * 2) / 5 + 0.1)
  })
  it('shows three choices to the clever, one of them right', () => {
    const s = quiz.start({ ...NO_MODIFIERS, eliminate: true }, 5, 'study-exam')
    const v = quiz.view(s)
    expect(v.choices).toHaveLength(3)
    expect(new Set(v.choices).size).toBe(3)
    expect(v.correct).toBeGreaterThanOrEqual(0)
    expect(v.correct).toBeLessThan(3)
    expect(quiz.view(answer(s, true)).index).toBe(1)
  })
  it('ends by itself when time runs out, scoring what was answered', () => {
    let s = quiz.start(NO_MODIFIERS, 5, 'study-exam')
    for (let i = 0; i < 20 * 120; i++) s = quiz.step(s, [])
    expect(quiz.done(s)).toBe(true)
    expect(quiz.view(s).timeLeft).toBe(0)
    expect(quiz.score(s)).toBe(0)
  })
  it('gives more time when clever', () => {
    expect(quiz.view(quiz.start({ ...NO_MODIFIERS, preview: 1.2 }, 5)).timeTotal).toBeCloseTo(24)
    expect(quiz.view(quiz.start(NO_MODIFIERS, 5)).timeTotal).toBe(20)
  })
  it('ignores answers during the pause after each answer', () => {
    let s = quiz.start(NO_MODIFIERS, 5, 'study-exam')
    const choose: GameInput = { kind: 'choose', option: 0 }
    s = quiz.step(s, [choose])
    expect(quiz.view(s).picked).toBe(0)
    s = quiz.step(s, [{ kind: 'choose', option: 1 }])
    expect(quiz.view(s).picked).toBe(0)
    s = pause(s)
    expect(quiz.view(s).index).toBe(1)
    expect(quiz.view(s).picked).toBeNull()
    expect(s.answers).toHaveLength(1)
  })
  it('ignores pointer input and out-of-range choices', () => {
    let s = quiz.start(NO_MODIFIERS, 5, 'tutor')
    s = quiz.step(s, [{ kind: 'pointer', phase: 'down', x: 0, y: 0 }, { kind: 'choose', option: 7 }])
    expect(quiz.view(s).picked).toBeNull()
  })
  it('uses general questions for an unknown theme', () => {
    expect(quiz.start(NO_MODIFIERS, 5, 'nope').questions.every((q) => q.subject === 'general')).toBe(true)
  })
})
