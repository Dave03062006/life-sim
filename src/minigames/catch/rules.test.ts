import { describe, expect, it } from 'vitest'
import { NO_MODIFIERS, type GameInput } from '../framework'
import { catchGame, type CatchView } from './rules'

type Pick = (v: CatchView) => number | undefined

/** Runs a whole game; each step the bot picks an x to go to and presses left or right. */
const play = (seed: number, aim: Pick, how: 'keys' | 'pointer' = 'keys') => {
  let s = catchGame.start(NO_MODIFIERS, seed)
  let held = 0
  while (!catchGame.done(s)) {
    const v = catchGame.view(s)
    const goal = aim(v)
    const inputs: GameInput[] = []
    if (how === 'pointer') {
      if (goal !== undefined) inputs.push({ kind: 'pointer', phase: 'move', x: goal, y: 0.5 })
    } else {
      const want = goal === undefined || Math.abs(goal - v.x) < 0.01 ? 0 : goal > v.x ? 1 : -1
      if (want !== held) {
        if (held) inputs.push({ kind: 'key', key: held > 0 ? 'right' : 'left', down: false })
        if (want) inputs.push({ kind: 'key', key: want > 0 ? 'right' : 'left', down: true })
        held = want
      }
    }
    s = catchGame.step(s, inputs)
  }
  return s
}
const lowest = (good: boolean): Pick => (v) => v.items.filter((i) => i.good === good).sort((a, b) => b.y - a.y)[0]?.x

describe('catch', () => {
  it('drops the same items for the same seed', () => {
    const run = (seed: number) => {
      let s = catchGame.start(NO_MODIFIERS, seed)
      for (let i = 0; i < 3 * 120; i++) s = catchGame.step(s, [])
      return catchGame.view(s)
    }
    expect(run(5)).toEqual(run(5))
    expect(run(5).items.length).toBeGreaterThan(0)
  })
  it('catches what the basket is under, and a perfect follower scores well', () => {
    for (const how of ['keys', 'pointer'] as const) {
      const s = play(5, lowest(true), how)
      expect(catchGame.view(s).caught).toBeGreaterThan(0)
      expect(catchGame.score(s)).toBeGreaterThan(0.7)
    }
  })
  it('loses points for bad items', () => {
    const s = play(5, lowest(false))
    expect(catchGame.view(s).hit).toBeGreaterThan(0)
    expect(catchGame.score(s)).toBe(0)
  })
  it('moves with a held key until it is released, and stays on screen', () => {
    let s = catchGame.start(NO_MODIFIERS, 5)
    s = catchGame.step(s, [{ kind: 'key', key: 'left', down: true }])
    for (let i = 0; i < 240; i++) s = catchGame.step(s, [])
    expect(catchGame.view(s).x).toBeCloseTo(catchGame.view(s).width / 2)
    s = catchGame.step(s, [{ kind: 'key', key: 'left', down: false }])
    const x = catchGame.view(s).x
    s = catchGame.step(s, [])
    expect(catchGame.view(s).x).toBe(x)
  })
  it('cancels opposite keys, and a key press takes over from a pointer target', () => {
    let s = catchGame.start(NO_MODIFIERS, 5)
    s = catchGame.step(s, [{ kind: 'key', key: 'left', down: true }, { kind: 'key', key: 'right', down: true }])
    expect(catchGame.view(s).x).toBe(0.5)
    s = catchGame.step(s, [{ kind: 'key', key: 'left', down: false }, { kind: 'key', key: 'right', down: false }, { kind: 'pointer', phase: 'down', x: 0.9, y: 0.5 }])
    expect(catchGame.view(s).x).toBeGreaterThan(0.5)
    s = catchGame.step(s, [{ kind: 'key', key: 'right', down: true }, { kind: 'key', key: 'right', down: false }])
    const x = catchGame.view(s).x
    s = catchGame.step(s, [])
    expect(catchGame.view(s).x).toBe(x)
  })
  it('subtracts hits from catches', () => {
    const s = { ...catchGame.start(NO_MODIFIERS, 5), caught: 2, hit: 1, goodSpawned: 4 }
    expect(catchGame.score(s)).toBe(0.25)
  })
  it('ends by itself after 15 seconds', () => {
    let s = catchGame.start(NO_MODIFIERS, 5)
    for (let i = 0; i < 15 * 120 - 1; i++) s = catchGame.step(s, [])
    expect(catchGame.done(s)).toBe(false)
    s = catchGame.step(s, [])
    expect(catchGame.done(s)).toBe(true)
    expect(catchGame.score(s)).toBe(0)
  })
})
