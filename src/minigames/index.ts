import type { MinigameType } from '../content/types'
import type { GameRules } from './framework'
import { GAMES } from './registry'

// oxlint-disable-next-line no-explicit-any -- each game keeps its own state type
export const rulesFor = (type: MinigameType): GameRules<any, any> => GAMES[type].rules
