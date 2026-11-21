import { STEP, type GameInput, type GameRules, type Modifiers } from '../framework'

export interface TappingView { meter: number; band: [number, number]; elapsed: number; total: number; done: boolean }
export interface TappingState { mods: Modifiers; steps: number; meter: number; inBand: number }

const isPress = (i: GameInput) => (i.kind === 'key' ? i.key === 'primary' && i.down : i.kind === 'pointer' && i.phase === 'down')
const totalSteps = (m: Modifiers) => Math.round((12 * m.time) / STEP)

function bandAt(steps: number, m: Modifiers): [number, number] {
  const c = 0.6 + 0.1 * m.wobble * Math.sin(1.3 * steps * STEP)
  return [c - 0.12 * m.window, c + 0.12 * m.window]
}

export const tapping: GameRules<TappingState, TappingView> = {
  type: 'tapping',
  input: 'keys',
  start: (mods) => ({ mods, steps: 0, meter: 0.5, inBand: 0 }),
  step(state, inputs) {
    if (state.steps >= totalSteps(state.mods)) return state
    const taps = inputs.filter(isPress).length
    const meter = Math.min(1, Math.max(0, state.meter + 0.12 * taps - 0.35 * state.mods.drain * STEP))
    const steps = state.steps + 1
    const [lo, hi] = bandAt(steps, state.mods)
    return { ...state, steps, meter, inBand: state.inBand + (meter >= lo && meter <= hi ? 1 : 0) }
  },
  view: (s) => ({ meter: s.meter, band: bandAt(s.steps, s.mods), elapsed: s.steps * STEP, total: totalSteps(s.mods) * STEP, done: s.steps >= totalSteps(s.mods) }),
  done: (s) => s.steps >= totalSteps(s.mods),
  score: (s) => s.inBand / totalSteps(s.mods),
}
