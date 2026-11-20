import type { ActivityDef } from '../content/types'
import { NO_MODIFIERS, type Modifiers } from '../minigames/framework'
import { energyLeft } from './energy'
import { stageOf } from './stages'
import type { Life } from './types'

export function modifiersFor(life: Life, def: ActivityDef, relaxed: boolean): Modifiers {
  const m = { ...NO_MODIFIERS }
  const stage = stageOf(life.age).id
  if (life.stats.stress >= 60) {
    m.wobble = 1
    m.time *= 0.85
  }
  if (energyLeft(life) < def.energy) m.window *= 0.9
  if (stage === 'small-child' || stage === 'child') m.window *= 1.25
  if (stage === 'senior') m.speed *= 0.85
  if (relaxed) {
    m.window *= 1.3
    m.speed *= 0.8
    m.time *= 1.3
  }
  return m
}
