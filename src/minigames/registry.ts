import type { ComponentType, ReactNode } from 'react'
import type { ActivityDef, MinigameType } from '../content/types'
import type { GameInput, GameRules } from './framework'
import { timing } from './timing/rules'
import { TimingView } from './timing/View'

export interface GameEntry {
  // oxlint-disable-next-line no-explicit-any -- each game keeps its own state and view types
  rules: GameRules<any, any>
  // oxlint-disable-next-line no-explicit-any
  View: ComponentType<{ view: any; def: ActivityDef; send(input: GameInput): void; effects?: string; children?: ReactNode }>
  instruction: string
  verb?: string // the play button's label; no button when absent
}

const TIMING: GameEntry = { rules: timing, View: TimingView, instruction: 'Stop the marker in the green to score. The gold centre is best.', verb: 'Stop' }

// Types not built yet play as Timing until Tasks 2–6 give them their own entries.
export const GAMES: Record<MinigameType, GameEntry> = {
  timing: TIMING,
  tapping: TIMING,
  memory: TIMING,
  quiz: TIMING,
  catch: TIMING,
  typing: TIMING,
}
