import { STEP, type GameInput, type GameRules, type Modifiers } from '../framework'

export interface TimingView { marker: number; zone: [number, number]; core: [number, number]; stopped: boolean }
export interface TimingState { mods: Modifiers; steps: number; stoppedAt: number | null }

const CENTRE = 0.68
const NEAR = 0.08
const LIMIT_SECONDS = 12

function markerAt(steps: number, m: Modifiers): number {
  const t = steps * STEP
  const x = 0.5 + 0.46 * Math.sin(2.5 * m.speed * t) + m.wobble * (0.034 * Math.sin(19 * t) + 0.016 * Math.sin(31 * t))
  return Math.min(0.99, Math.max(0.01, x))
}

const zoneOf = (m: Modifiers): [number, number] => [CENTRE - 0.1 * m.window, CENTRE + 0.1 * m.window]
const coreOf = (m: Modifiers): [number, number] => [CENTRE - 0.02 * m.window, CENTRE + 0.02 * m.window]
const within = (x: number, [lo, hi]: [number, number], pad = 0) => x >= lo - pad && x <= hi + pad
const isPress = (i: GameInput) => (i.kind === 'key' ? i.key === 'primary' && i.down : i.phase === 'down')

export const timing: GameRules<TimingState, TimingView> = {
  type: 'timing',
  start: (mods) => ({ mods, steps: 0, stoppedAt: null }),
  step(state, inputs) {
    if (state.stoppedAt !== null) return state
    // a press freezes the marker where it is now, before time advances
    if (inputs.some(isPress)) return { ...state, stoppedAt: markerAt(state.steps, state.mods) }
    const steps = state.steps + 1
    const out = steps * STEP >= LIMIT_SECONDS * state.mods.time
    return { ...state, steps, stoppedAt: out ? markerAt(steps, state.mods) : null }
  },
  view: (s) => ({
    marker: s.stoppedAt ?? markerAt(s.steps, s.mods),
    zone: zoneOf(s.mods),
    core: coreOf(s.mods),
    stopped: s.stoppedAt !== null,
  }),
  done: (s) => s.stoppedAt !== null,
  score(s) {
    if (s.stoppedAt === null) return 0
    if (within(s.stoppedAt, coreOf(s.mods))) return 1
    if (within(s.stoppedAt, zoneOf(s.mods))) return 0.7
    return within(s.stoppedAt, zoneOf(s.mods), NEAR) ? 0.4 : 0
  },
}
