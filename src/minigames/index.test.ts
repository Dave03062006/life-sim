import { expect, it } from 'vitest'
import { GAMES } from './registry'
import { NO_MODIFIERS } from './framework'

it('gives every type its own entry with an instruction and a verb', () => {
  for (const type of ['timing', 'tapping', 'memory', 'quiz', 'catch', 'typing'] as const) {
    expect(GAMES[type].rules.type).toBe(type)
    expect(GAMES[type].instruction.length).toBeGreaterThan(10)
    expect(GAMES[type].rules.start(NO_MODIFIERS, 1, 'x')).toBeTruthy()
  }
})
