import type { CategoryId, Life, StageId, StatKey } from '../life/types'

export type MinigameType = 'timing' | 'tapping' | 'memory' | 'quiz' | 'catch' | 'typing'
export type ResultTier = 'fail' | 'weak' | 'good' | 'great'
export type Requirement =
  | { kind: 'min-age'; age: number; reason: string }
  | { kind: 'stat'; key: StatKey; min: number; reason: string; openNote: string }
export interface ActivityDef {
  id: string
  category: CategoryId
  title: string
  description: string
  icon: string // an art id such as 'act-futsal'
  stages: StageId[]
  minigame?: { type: MinigameType; theme: string } // absent: the activity finishes at once as a Good result
  energy: number // cost; 0 for rest
  energyBack?: number // energy returned by a non-rest activity
  rest?: number // base energy restored by a rest activity
  money?: number // negative is a price, positive is earnings
  effects: Partial<Record<StatKey, number>> // benefits scale with the result; costs do not
  failPenalty?: Partial<Record<StatKey, number>>
  requires?: Requirement[]
  lines: string | Record<ResultTier, string> // journal text
}
export interface ContentPack {
  id: Life['country']
  activities: ActivityDef[]
  milestones: Record<number, string>
}
