import { describe, expect, it } from 'vitest'
import { packFor } from '../content'
import { NO_MODIFIERS } from '../minigames/framework'
import { modifiersFor } from './modifiers'
import { testLife } from './testLife'

const gym = packFor('indonesia').activities.find((a) => a.id === 'gym')!

describe('modifiersFor', () => {
  it('leaves a calm, rested teenager alone', () => {
    expect(modifiersFor(testLife(), gym, false)).toEqual(NO_MODIFIERS)
  })
  it('shakes and hurries the stressed, narrows targets for the worn out, and eases relaxed play', () => {
    const stressed = modifiersFor(testLife({ stats: { ...testLife().stats, stress: 60 } }), gym, false)
    expect(stressed.wobble).toBe(1)
    expect(stressed.time).toBeCloseTo(0.85)
    expect(modifiersFor(testLife({ energySpent: 9 }), gym, false).window).toBeCloseTo(0.9)
    expect(modifiersFor(testLife({ age: 8 }), gym, false).window).toBeCloseTo(1.25)
    expect(modifiersFor(testLife({ age: 70 }), gym, false).speed).toBeCloseTo(0.85)
    const relaxed = modifiersFor(testLife(), gym, true)
    expect([relaxed.window, relaxed.speed, relaxed.time].map((n) => +n.toFixed(2))).toEqual([1.3, 0.8, 1.3])
  })
})
