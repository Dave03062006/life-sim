import { createRng } from '../../engine/random'
import { STEP, type GameRules, type Modifiers } from '../framework'

interface Item { id: number; x: number; y: number; good: boolean; missed: boolean }
export interface CatchView { x: number; width: number; items: { id: number; x: number; y: number; good: boolean }[]; caught: number; hit: number; done: boolean }
export interface CatchState {
  mods: Modifiers; steps: number; x: number; left: boolean; right: boolean; target: number | null
  items: Item[]; nextId: number; rngState: number; caught: number; hit: number; goodSpawned: number
}

const SPAWN_STEPS = Math.round(0.6 / STEP)
const totalSteps = (m: Modifiers) => Math.round((15 * m.time) / STEP)
const widthOf = (m: Modifiers) => 0.16 * m.window

export const catchGame: GameRules<CatchState, CatchView> = {
  type: 'catch',
  input: 'keys',
  start: (mods, seed) => ({ mods, steps: 0, x: 0.5, left: false, right: false, target: null, items: [], nextId: 0, rngState: seed, caught: 0, hit: 0, goodSpawned: 0 }),
  step(state, inputs) {
    if (state.steps >= totalSteps(state.mods)) return state
    const { mods } = state
    let { left, right, target } = state
    for (const i of inputs) {
      if (i.kind === 'key' && (i.key === 'left' || i.key === 'right')) {
        if (i.key === 'left') left = i.down
        else right = i.down
        if (i.down) target = null
      } else if (i.kind === 'pointer' && i.phase !== 'up') target = i.x
    }
    const reach = 0.9 * mods.speed * mods.move * STEP
    const dir = Number(right) - Number(left)
    const half = widthOf(mods) / 2
    let x = state.x
    if (dir) x += dir * reach
    else if (target !== null) x += Math.max(-reach, Math.min(reach, target - x))
    x = Math.min(1 - half, Math.max(half, x))

    let { caught, hit, goodSpawned } = state
    const items: Item[] = []
    for (const it of state.items) {
      const y = it.y + (STEP * mods.speed) / 1.6
      if (y >= 1) continue
      if (it.missed || y < 0.9) { items.push({ ...it, y }); continue }
      if (Math.abs(it.x - x) <= half) { // caught or hit: gone this step
        if (it.good) { caught++; goodSpawned++ } else hit++
      } else {
        if (it.good) goodSpawned++
        items.push({ ...it, y, missed: true })
      }
    }
    const steps = state.steps + 1
    let { nextId, rngState } = state
    if (steps % SPAWN_STEPS === 0) {
      const rng = createRng(rngState)
      const ix = 0.05 + 0.9 * rng.next()
      items.push({ id: nextId++, x: ix, y: 0, good: rng.next() < 0.7, missed: false })
      rngState = rng.state
    }
    return { ...state, steps, x, left, right, target, items, nextId, rngState, caught, hit, goodSpawned }
  },
  view: (s) => ({
    x: s.x, width: widthOf(s.mods), caught: s.caught, hit: s.hit, done: s.steps >= totalSteps(s.mods),
    items: s.items.map(({ id, x, y, good }) => ({ id, x, y, good })),
  }),
  done: (s) => s.steps >= totalSteps(s.mods),
  score: (s) => (s.goodSpawned ? Math.min(1, Math.max(0, (s.caught - s.hit) / s.goodSpawned)) : 0),
}
