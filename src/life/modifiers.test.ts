import { describe, expect, it } from 'vitest'
import { packFor } from '../content'
import { NO_MODIFIERS } from '../minigames/framework'
import { modifiersFor } from './modifiers'
import { testLife } from './testLife'

const gym = packFor('indonesia').activities.find((a) => a.id === 'gym')!

describe('modifiersFor', () => {
  it('leaves a calm, rested teenager alone', () => {
    expect(modifiersFor(testLife(), gym, false)).toEqual({ ...NO_MODIFIERS, preview: expect.closeTo(1.07) }) // Smarts 64 previews a little longer
  })
  it('shakes and hurries the stressed, narrows targets for the worn out, and eases relaxed play', () => {
    const stressed = modifiersFor(testLife({ stats: { ...testLife().stats, stress: 60 } }), gym, false)
    expect(stressed.wobble).toBe(1)
    expect(stressed.time).toBeCloseTo(0.85)
    expect(modifiersFor(testLife({ energySpent: 9 }), gym, false).window).toBeCloseTo(0.9)
    expect(modifiersFor(testLife({ age: 8 }), gym, false).window).toBeCloseTo(1.25)
    expect(modifiersFor(testLife({ age: 70 }), gym, false)).toMatchObject({ move: 0.85, speed: 1 })
    const relaxed = modifiersFor(testLife(), gym, true)
    expect([relaxed.window, relaxed.speed, relaxed.time].map((n) => +n.toFixed(2))).toEqual([1.3, 0.8, 1.3])
  })
  it('slows the unhealthy and helps the clever', () => {
    const sick = modifiersFor(testLife({ stats: { ...testLife().stats, health: 39 } }), gym, false)
    expect([sick.drain, sick.move, sick.speed]).toEqual([1.25, 0.85, 1])
    expect(modifiersFor(testLife({ stats: { ...testLife().stats, smarts: 90 } }), gym, false)).toMatchObject({ preview: 1.2, eliminate: true })
    expect(modifiersFor(testLife({ stats: { ...testLife().stats, smarts: 20 } }), gym, false).preview).toBeCloseTo(0.85)
    expect(modifiersFor(testLife(), gym, false)).toMatchObject({ drain: 1, eliminate: false })
    const relaxed = modifiersFor(testLife(), gym, true)
    expect([+relaxed.drain.toFixed(2), +relaxed.preview.toFixed(3)]).toEqual([0.8, 1.391]) // 1.07 × 1.3
  })
})
