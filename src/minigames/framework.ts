import type { MinigameType } from '../content/types'

export const STEP = 1 / 120
export type GameKey = 'left' | 'right' | 'up' | 'down' | 'primary'
export type GameInput =
  | { kind: 'key'; key: GameKey; down: boolean }
  | { kind: 'pointer'; phase: 'down' | 'move' | 'up'; x: number; y: number }
  | { kind: 'choose'; option: number } // 0-based; keys 1–4 or a click on a choice
  | { kind: 'text'; text: string } // one character, or '\b' for Backspace
export interface Modifiers {
  wobble: number; speed: number; window: number; time: number
  drain: number // how fast meters fall; 1 normal
  preview: number // multiplies quiz time and memory preview time; 1 normal
  eliminate: boolean // the quiz removes one wrong answer
}
export const NO_MODIFIERS: Modifiers = { wobble: 0, speed: 1, window: 1, time: 1, drain: 1, preview: 1, eliminate: false }
export interface GameRules<State, View> {
  type: MinigameType
  input: 'keys' | 'text' // 'text' sends printable keys as text inputs instead of shortcuts
  start(mods: Modifiers, seed: number, theme?: string): State // theme = the activity's minigame.theme
  step(state: State, inputs: readonly GameInput[]): State // inputs apply first, then time advances by STEP
  view(state: State): View
  done(state: State): boolean
  score(state: State): number // 0 to 1, once done
}
