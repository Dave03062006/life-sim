import type { MinigameType } from '../content/types'
import type { GameRules } from './framework'
import { timing } from './timing/rules'

// Types not built yet play as Timing (Plan 2 replaces them).
// oxlint-disable-next-line no-explicit-any -- each game keeps its own state type
export function rulesFor(_type: MinigameType): GameRules<any, any> {
  return timing
}
