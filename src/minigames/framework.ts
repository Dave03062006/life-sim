import type { MinigameType } from '../content/types'

export const STEP = 1 / 120
export type GameKey = 'left' | 'right' | 'up' | 'down' | 'primary'
export type GameInput =
  | { kind: 'key'; key: GameKey; down: boolean }
  | { kind: 'pointer'; phase: 'down' | 'move' | 'up'; x: number; y: number }
export interface Modifiers { wobble: number; speed: number; window: number; time: number }
export const NO_MODIFIERS: Modifiers = { wobble: 0, speed: 1, window: 1, time: 1 }
export interface GameRules<State, View> {
  type: MinigameType
  start(mods: Modifiers, seed: number): State
  step(state: State, inputs: readonly GameInput[]): State // inputs apply first, then time advances by STEP
  view(state: State): View
  done(state: State): boolean
  score(state: State): number // 0 to 1, once done
}
