import { describe, expect, it } from 'vitest'
import { NO_MODIFIERS, type Modifiers } from '../framework'
import { tapping, type TappingView } from './rules'

const play = (mods: Modifiers, pressWhen: (s: TappingView) => boolean) => {
  let s = tapping.start(mods, 1)
  while (!tapping.done(s)) s = tapping.step(s, pressWhen(tapping.view(s)) ? [{ kind: 'key', key: 'primary', down: true }] : [])
  return s
}

describe('tapping', () => {
  it('rewards keeping the meter in the band', () => {
    expect(tapping.score(play(NO_MODIFIERS, () => false))).toBeLessThan(0.3)
    const s = play(NO_MODIFIERS, (v) => v.meter < (v.band[0] + v.band[1]) / 2 - 0.05)
    expect(tapping.score(s)).toBeGreaterThan(0.85)
  })
  it('keeps the meter between 0 and 1 however fast you tap', () => {
    let s = tapping.start(NO_MODIFIERS, 1)
    for (let i = 0; i < 200; i++) s = tapping.step(s, Array(5).fill({ kind: 'key', key: 'primary', down: true }))
    expect(tapping.view(s).meter).toBe(1)
  })
  it('drains faster when unhealthy and ends by itself in 12 seconds', () => {
    const fall = (drain: number) => { let s = tapping.start({ ...NO_MODIFIERS, drain }, 1); for (let i = 0; i < 120; i++) s = tapping.step(s, []); return tapping.view(s).meter }
    expect(fall(1)).toBeCloseTo(0.15, 2)
    expect(fall(1.25)).toBeLessThan(fall(1))
    let s = tapping.start(NO_MODIFIERS, 1)
    for (let i = 0; i < 12 * 120; i++) s = tapping.step(s, [])
    expect(tapping.done(s)).toBe(true)
  })
  it('counts a held key once', () => {
    const a = tapping.step(tapping.start(NO_MODIFIERS, 1), [{ kind: 'key', key: 'primary', down: true }])
    const b = tapping.step(tapping.start(NO_MODIFIERS, 1), [{ kind: 'key', key: 'primary', down: true }, { kind: 'key', key: 'primary', down: true }])
    expect(tapping.view(b).meter - tapping.view(a).meter).toBeCloseTo(0.12)
  })
})
