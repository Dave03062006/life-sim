import { createRng } from '../../engine/random'
import { STEP, type GameRules, type Modifiers } from '../framework'
import { THEMES } from '../themes'

const COUNT = 5
const DEFAULT_WORDS = ['apple', 'river', 'house', 'green', 'music', 'light', 'table', 'smile']
export interface TypingView { target: string; typed: string; timeLeft: number; timeTotal: number; done: boolean }
export interface TypingState { mods: Modifiers; target: string; typed: string; steps: number }

const totalSteps = (m: Modifiers) => Math.round((20 * m.time) / STEP)
const isDone = (s: TypingState) => s.typed.length >= s.target.length || s.steps >= totalSteps(s.mods)

export const typing: GameRules<TypingState, TypingView> = {
  type: 'typing',
  input: 'text',
  start(mods, seed, theme = '') {
    const words = THEMES[theme]?.typingWords ?? DEFAULT_WORDS
    return { mods, target: createRng(seed).shuffle(words).slice(0, COUNT).join(' '), typed: '', steps: 0 }
  },
  step(state, inputs) {
    if (isDone(state)) return state
    let typed = state.typed
    for (const i of inputs) {
      if (i.kind !== 'text') continue
      if (i.text === '\b') typed = typed.slice(0, -1)
      else if (typed.length < state.target.length) typed += i.text
    }
    return { ...state, typed, steps: state.steps + 1 }
  },
  view: (s) => ({ target: s.target, typed: s.typed, timeLeft: Math.max(0, totalSteps(s.mods) - s.steps) * STEP, timeTotal: totalSteps(s.mods) * STEP, done: isDone(s) }),
  done: isDone,
  score(s) {
    if (!s.typed) return 0
    const right = [...s.typed].filter((c, i) => c === s.target[i]).length
    return (right / s.typed.length) * Math.min(1, s.typed.length / s.target.length)
  },
}
