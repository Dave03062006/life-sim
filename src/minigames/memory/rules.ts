import { createRng } from '../../engine/random'
import { STEP, type GameRules, type Modifiers } from '../framework'

const LENGTH = 5
export interface MemoryView { phase: 'watch' | 'repeat' | 'done'; lit: number | null; entered: number[]; length: number; pads: 4 }
export interface MemoryState { mods: Modifiers; seq: number[]; steps: number; entered: number[] }

const cycle = (m: Modifiers) => 0.8 * m.preview // seconds per pad: lit 0.6, gap 0.2
const watchSteps = (m: Modifiers) => Math.round((LENGTH * cycle(m)) / STEP)
const endSteps = (m: Modifiers) => watchSteps(m) + Math.round((10 * m.time) / STEP)
const isDone = (s: MemoryState) => s.entered.length >= LENGTH || s.steps >= endSteps(s.mods)

export const memory: GameRules<MemoryState, MemoryView> = {
  type: 'memory',
  input: 'keys',
  start(mods, seed) {
    const rng = createRng(seed)
    return { mods, seq: Array.from({ length: LENGTH }, () => rng.int(0, 4)), steps: 0, entered: [] }
  },
  step(state, inputs) {
    if (isDone(state)) return state
    let entered = state.entered
    if (state.steps >= watchSteps(state.mods)) {
      const picks = inputs.flatMap((i) => (i.kind === 'choose' ? [i.option] : []))
      entered = [...entered, ...picks].slice(0, LENGTH)
    }
    return { ...state, steps: state.steps + 1, entered }
  },
  view(s) {
    const watching = s.steps < watchSteps(s.mods)
    const t = s.steps * STEP
    const slot = Math.floor(t / cycle(s.mods))
    const lit = watching && t - slot * cycle(s.mods) < 0.6 * s.mods.preview ? s.seq[slot]! : null
    return { phase: watching ? 'watch' : isDone(s) ? 'done' : 'repeat', lit, entered: s.entered, length: LENGTH, pads: 4 }
  },
  done: isDone,
  score(s) {
    const correct = s.seq.filter((p, i) => s.entered[i] === p).length
    const streak = s.seq.findIndex((p, i) => s.entered[i] !== p)
    return (0.7 * correct) / LENGTH + (0.3 * (streak < 0 ? LENGTH : streak)) / LENGTH
  },
}
