import type { ComponentType, ReactNode } from 'react'
import type { ActivityDef, MinigameType } from '../content/types'
import type { GameInput, GameRules } from './framework'
import { memory } from './memory/rules'
import { MemoryView } from './memory/View'
import { quiz } from './quiz/rules'
import { QuizView } from './quiz/View'
import { tapping } from './tapping/rules'
import { TappingView } from './tapping/View'
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
  tapping: { rules: tapping, View: TappingView, instruction: 'Tap to keep the meter inside the band until time runs out.', verb: 'Tap' },
  memory: { rules: memory, View: MemoryView, instruction: 'Watch the order the pads light up, then repeat it.' },
  quiz: { rules: quiz, View: QuizView, instruction: 'Answer five questions before time runs out. Press 1 to 4 or click.' },
  catch: TIMING,
  typing: TIMING,
}
