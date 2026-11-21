import { describe, expect, it } from 'vitest'
import { NO_MODIFIERS, STEP, type Modifiers } from '../framework'
import { memory } from './rules'

const watchSteps = (mods: Modifiers = NO_MODIFIERS) => Math.round((5 * 0.8 * mods.preview) / STEP)
const sequenceOf = (seed: number) => {
  const seq: number[] = []
  let s = memory.start(NO_MODIFIERS, seed)
  let last: number | null = null
  for (let i = 0; i < watchSteps(); i++) {
    s = memory.step(s, [])
    const lit = memory.view(s).lit
    if (lit !== null && last === null) seq.push(lit)
    last = lit
  }
  return seq
}
const repeat = (seq: number[]) => {
  let s = memory.start(NO_MODIFIERS, 3)
  for (let i = 0; i < watchSteps(); i++) s = memory.step(s, [])
  for (const p of seq) s = memory.step(s, [{ kind: 'choose', option: p }])
  return s
}

describe('memory', () => {
  it('shows the same sequence for the same seed', () => {
    expect(sequenceOf(3)).toEqual(sequenceOf(3))
    expect(sequenceOf(3)).toHaveLength(5)
  })
  it('scores a perfect repeat as 1 and ignores input while watching', () => {
    const seq = sequenceOf(3)
    let s = memory.start(NO_MODIFIERS, 3)
    s = memory.step(s, [{ kind: 'choose', option: 0 }])
    expect(memory.view(s).entered).toEqual([])
    for (let i = 0; i < watchSteps(); i++) s = memory.step(s, [])
    for (const p of seq) s = memory.step(s, [{ kind: 'choose', option: p }])
    expect([memory.done(s), memory.score(s)]).toEqual([true, 1])
  })
  it('values an early mistake less than a late one', () => {
    const seq = sequenceOf(3)
    const wrong = (at: number) => repeat(seq.map((p, i) => (i === at ? (p + 1) % 4 : p)))
    expect(memory.score(wrong(0))).toBeCloseTo((0.7 * 4) / 5)
    expect(memory.score(wrong(4))).toBeCloseTo((0.7 * 4) / 5 + (0.3 * 4) / 5)
  })
  it('takes several entries in one step in order, and stops at five', () => {
    const s = repeat([0, 1, 2, 3, 0, 1])
    expect(memory.view(s).entered).toEqual([0, 1, 2, 3, 0])
  })
  it('ignores pointer and arrow inputs', () => {
    let s = repeat([])
    s = memory.step(s, [{ kind: 'pointer', phase: 'down', x: 0, y: 0 }, { kind: 'key', key: 'left', down: true }])
    expect(memory.view(s).entered).toEqual([])
  })
  it('ends by itself ten seconds into the repeat phase', () => {
    let s = memory.start(NO_MODIFIERS, 3)
    for (let i = 0; i < watchSteps() + 10 * 120; i++) s = memory.step(s, [])
    expect(memory.done(s)).toBe(true)
    expect(memory.score(s)).toBe(0)
  })
  it('watches longer when clever', () => {
    expect(watchSteps({ ...NO_MODIFIERS, preview: 1.2 })).toBeGreaterThan(watchSteps())
  })
})
