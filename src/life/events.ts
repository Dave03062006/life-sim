import type { Condition, ContentPack, EventAction, EventDef, MannerKind, Outcome } from '../content/types'
import { createRng, type Rng } from '../engine/random'
import { nudgeCloseness, personById } from './people'
import { stageOf } from './stages'
import { applyChanges, roundAway } from './stats'
import type { Change, JournalEntry, Life, Person, StatKey } from './types'

export const DEFAULT_MANNERS: { id: string; label: string; kind: MannerKind }[] = [
  { id: 'calm', label: 'Calmly', kind: 'calm' },
  { id: 'blunt', label: 'Bluntly', kind: 'blunt' },
  { id: 'joke', label: 'With a joke', kind: 'joke' },
]
export type EventTier = 'success' | 'mixed' | 'fail'
export const MOMENT_PASSED = 'The moment passed.' // a cast person has gone; nothing happens

function holds(life: Life, c: Condition): boolean {
  switch (c.kind) {
    case 'stat': return life.stats[c.key] >= (c.min ?? 0) && life.stats[c.key] <= (c.max ?? 100)
    case 'memory': return life.memories.some((m) => m.id === c.id)
    case 'no-memory': return !life.memories.some((m) => m.id === c.id)
    case 'money': return life.money >= c.min
  }
}

const CRUSH_GENDER = { women: ['female'], men: ['male'], both: ['female', 'male'], none: [] } as const

function fits(life: Life, p: Person, relation: Person['relation']): boolean {
  if (p.relation !== relation) return false
  return relation !== 'crush' || (CRUSH_GENDER[life.interest ?? 'none'] as readonly string[]).includes(p.gender)
}

/** Each role picks uniformly among fitting people not already cast; null if any role cannot be filled. */
function castFor(life: Life, ev: EventDef, rng: Rng | null): Record<string, string> | null {
  const cast: Record<string, string> = {}
  for (const [role, relation] of Object.entries(ev.cast ?? {})) {
    const pool = life.people.filter((p) => fits(life, p, relation) && !Object.values(cast).includes(p.id))
    if (pool.length === 0) return null
    // without an rng (the eligibility check) take the first: pools are per relation, so any pick fills the same
    cast[role] = (rng ? rng.pick(pool) : pool[0]!).id
  }
  return cast
}

export function fill(text: string, life: Life, cast: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => {
    if (key === 'name') return life.name
    const id = cast[key]
    return (id && personById(life, id)?.name) || whole
  })
}

/** Applies an outcome scaled by `scale`, plus `stress`; returns the life with its journal entry added. */
function applyOutcome(life: Life, outcome: Outcome, cast: Record<string, string>, scale: number, stress: number): { life: Life; entry: JournalEntry } {
  const deltas = new Map<StatKey, number>()
  for (const [key, delta] of Object.entries(outcome.effects ?? {}) as [StatKey, number][]) deltas.set(key, roundAway(delta * scale))
  if (stress) deltas.set('stress', (deltas.get('stress') ?? 0) + stress)
  const money = outcome.money ?? 0
  let next = applyChanges(life, [...[...deltas].map(([key, delta]): Change => ({ key, delta })), { key: 'money', delta: money }])
  const changes: Change[] = [...deltas.keys()].map((key) => ({ key, delta: next.stats[key] - life.stats[key] })).filter((c) => c.delta !== 0)
  if (money !== 0) changes.push({ key: 'money', delta: money })
  const people: JournalEntry['people'] = []
  for (const [role, delta] of Object.entries(outcome.closeness ?? {})) {
    const id = cast[role]
    if (!id || !delta) continue
    const nudged = nudgeCloseness(next, id, roundAway(delta * scale))
    next = nudged.life
    people.push(...nudged.moved)
  }
  const memory = outcome.memory
  if (memory && !next.memories.some((m) => m.id === memory.id)) {
    next = { ...next, memories: [...next.memories, { id: memory.id, age: life.age, text: fill(memory.text, life, cast), people: Object.values(cast) }] }
  }
  const entry: JournalEntry = { age: life.age, kind: 'event', text: fill(outcome.text, life, cast), changes, people }
  return { life: { ...next, journal: [...next.journal, entry] }, entry }
}

export function drawEvents(life: Life, pack: ContentPack): Life {
  const rng = createRng(life.rng)
  const roll = rng.next()
  const count = roll < 0.5 ? 1 : roll < 0.85 ? 2 : 3
  let next = life
  let bigDrawn = false
  for (let i = 0; i < count; i++) {
    const stage = stageOf(next.age).id
    const eligible = pack.events.filter((ev) =>
      ev.weight > 0 && ev.stages.includes(stage) && !next.seenEvents.includes(ev.id) && !(bigDrawn && ev.big) &&
      (ev.when ?? []).every((c) => holds(next, c)) && castFor(next, ev, null) !== null)
    if (eligible.length === 0) break
    const ev = rng.weighted(eligible, (e) => e.weight)
    const cast = castFor(next, ev, rng)!
    bigDrawn ||= !!ev.big
    next = { ...next, seenEvents: [...next.seenEvents, ev.id] }
    if (ev.kind === 'news') next = applyOutcome(next, ev.news ?? { text: ev.text }, cast, 1, 0).life
    else next = { ...next, pendingEvents: [...next.pendingEvents, { eventId: ev.id, cast }] }
  }
  return { ...next, rng: rng.state }
}

export function availableActions(life: Life, ev: EventDef, cast: Record<string, string>): { action: EventAction; openNote: string | null }[] {
  return (ev.actions ?? [])
    .filter((a) => (!a.romance || (life.interest !== null && life.interest !== 'none')) && (!a.open || holds(life, a.open.condition)))
    .map((a) => ({ action: { ...a, label: fill(a.label, life, cast) }, openNote: a.open ? fill(a.open.note, life, cast) : null }))
}

export function rollTier(life: Life, chance: number, manner: MannerKind, rng: Rng): EventTier {
  const shift = manner === 'joke' ? roundAway((life.stats.happiness - 50) / 2 + (life.stats.reputation - 50) / 4) : 0
  const roll = chance + shift + rng.int(-20, 21)
  return roll >= 60 ? 'success' : roll >= 35 ? 'mixed' : 'fail'
}

const MANNER_SCALE: Record<MannerKind, (tier: EventTier) => number> = {
  calm: () => 0.75,
  blunt: () => 1.5,
  joke: (tier) => (tier === 'fail' ? 1.25 : 1),
}

/** Drops leading pending events that cannot show: gone from the pack, or a cast person has left. */
export function dropStale(life: Life, pack: ContentPack): Life {
  const first = life.pendingEvents.findIndex((p) =>
    pack.events.some((e) => e.id === p.eventId) && Object.values(p.cast).every((id) => personById(life, id)))
  if (first === 0) return life
  return { ...life, pendingEvents: first < 0 ? [] : life.pendingEvents.slice(first) }
}

export function resolveEvent(life: Life, pack: ContentPack, actionId: string, mannerId: string): { life: Life; tier: EventTier; entry: JournalEntry; skipped: boolean } {
  const [pending, ...rest] = life.pendingEvents
  if (!pending) throw new Error('Nothing pending to resolve')
  const ev = pack.events.find((e) => e.id === pending.eventId)
  if (!ev) throw new Error(`Unknown event ${pending.eventId}`)
  if (Object.values(pending.cast).some((id) => !personById(life, id))) {
    return { life: { ...life, pendingEvents: rest }, tier: 'mixed', entry: { age: life.age, kind: 'event', text: MOMENT_PASSED, changes: [] }, skipped: true }
  }
  const action = availableActions(life, ev, pending.cast).find((o) => o.action.id === actionId)?.action
  if (!action) throw new Error(`Action ${actionId} is not available in ${ev.id}`)
  const manner = (ev.manners ?? DEFAULT_MANNERS).find((m) => m.id === mannerId)
  if (!manner) throw new Error(`Unknown manner ${mannerId} in ${ev.id}`)

  const rng = createRng(life.rng)
  const tier = rollTier(life, action.chance, manner.kind, rng)
  let next: Life = { ...life, rng: rng.state, pendingEvents: rest }
  const recall = ev.recall
  if (recall && life.memories.some((m) => m.id === recall.memory)) {
    next = { ...next, journal: [...next.journal, { age: life.age, kind: 'memory', text: fill(recall.text, life, pending.cast), changes: [] }] }
  }
  const done = applyOutcome(next, action.outcomes[tier], pending.cast, MANNER_SCALE[manner.kind](tier), manner.kind === 'calm' ? -2 : 0)
  return { life: done.life, tier, entry: done.entry, skipped: false }
}
