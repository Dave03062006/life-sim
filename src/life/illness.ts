import type { ContentPack, IllnessDef } from '../content/types'
import type { Rng } from '../engine/random'
import type { Modifiers } from '../minigames/framework'
import { applyChanges } from './stats'
import type { Change, Illness, JournalEntry, Life, StatKey } from './types'

export const LOW_HEALTH = 30
export const HIGH_STRESS = 70

const lower = (name: string): string => name.charAt(0).toLowerCase() + name.slice(1)
const defOf = (pack: ContentPack, i: Illness): IllnessDef | undefined => pack.illnesses.find((d) => d.id === i.id)
const silentNow = (def: IllnessDef, i: Illness): boolean => def.stages[i.stage]?.silent === true
const entry = (life: Life, text: string, changes: Change[] = []): JournalEntry => ({ age: life.age, kind: 'event', text, changes })

export function onsetChance(life: Life, def: IllnessDef): number {
  if ((def.gender && def.gender !== life.gender) || life.illnesses.some((i) => i.id === def.id)) return 0
  let chance = def.onset.find(([from]) => life.age >= from)?.[1] ?? 0
  if (life.stats.health < LOW_HEALTH) chance *= def.risk?.lowHealth ?? 1
  if (life.stats.stress >= HIGH_STRESS) chance *= def.risk?.highStress ?? 1
  for (const [id, mult] of Object.entries(def.risk?.untreated ?? {})) {
    if (life.illnesses.some((i) => i.id === id && i.treated === null)) chance *= mult ?? 1
  }
  if (def.vaccine && life.flags.includes(def.vaccine)) chance /= 2
  return Math.min(1, chance)
}

export function catchIllnesses(life: Life, pack: ContentPack, rng: Rng): Life {
  let next = life
  for (const def of pack.illnesses) {
    if (rng.next() >= onsetChance(next, def)) continue // rolled once per illness, even at chance 0
    const silent = def.stages[0]?.silent === true
    const caught: Illness = { id: def.id, since: next.age, stage: 0, known: !silent, treated: null }
    next = { ...next, illnesses: [...next.illnesses, caught], journal: silent ? next.journal : [...next.journal, entry(next, `You came down with ${lower(def.name)}.`)] }
  }
  return next
}

/** Untreated illnesses at a stage that is not silent. */
const symptomatic = (life: Life, pack: ContentPack): [Illness, IllnessDef][] =>
  life.illnesses.flatMap((i): [Illness, IllnessDef][] => {
    const def = defOf(pack, i)
    return def && i.treated === null && !silentNow(def, i) ? [[i, def]] : []
  })

export function applySymptoms(life: Life, pack: ContentPack): Life {
  const sum = new Map<StatKey, number>()
  for (const [i, def] of symptomatic(life, pack)) {
    for (const [key, delta] of Object.entries(def.stages[i.stage]?.symptoms ?? {}) as [StatKey, number][]) sum.set(key, (sum.get(key) ?? 0) + delta)
  }
  const next = applyChanges(life, [...sum].map(([key, delta]): Change => ({ key, delta })))
  const changes = [...sum.keys()].map((key): Change => ({ key, delta: next.stats[key] - life.stats[key] })).filter((c) => c.delta !== 0)
  return changes.length === 0 ? life : { ...next, journal: [...next.journal, entry(life, 'Being unwell took its toll this year.', changes)] }
}

/** Marks hidden illnesses known and returns their lines; 'symptoms' only reaches ones whose stage is no longer silent. */
export function reveal(life: Life, pack: ContentPack, how: 'check-up' | 'symptoms'): { life: Life; texts: string[] } {
  const texts: string[] = []
  const illnesses = life.illnesses.map((i) => {
    const def = defOf(pack, i)
    if (i.known || !def || (how === 'symptoms' && silentNow(def, i))) return i
    const name = lower(def.name)
    texts.push(how === 'check-up' ? `Your check-up found ${name}. It had been there quietly.` : `You had been feeling unwell for a while. A doctor said it was ${name}.`)
    return { ...i, known: true }
  })
  return { life: { ...life, illnesses }, texts }
}

export function discover(life: Life, pack: ContentPack, how: 'check-up' | 'symptoms'): Life {
  const { life: next, texts } = reveal(life, pack, how)
  return texts.length === 0 ? life : { ...next, journal: [...next.journal, ...texts.map((t) => entry(life, t))] }
}

export const knownIllnesses = (life: Life): Illness[] => life.illnesses.filter((i) => i.known)

/** Energy cut by symptoms that are untreated or only eased (the brief's rule). */
export function illnessEnergy(life: Life, pack: ContentPack): number {
  return life.illnesses.reduce((sum, i) => {
    const def = defOf(pack, i)
    return def && (i.treated === null || i.treated === 'eased') && !silentNow(def, i) ? sum + (def.stages[i.stage]?.energy ?? 0) : sum
  }, 0)
}

/** Illnesses whose mini-game effects apply: known, untreated, past any silent stage. */
const effective = (life: Life, pack: ContentPack): IllnessDef[] =>
  symptomatic(life, pack).filter(([i, d]) => i.known && d.minigame).map(([, d]) => d)

export const illnessEffects = (life: Life, pack: ContentPack): string[] => effective(life, pack).map((d) => d.minigame!.label)

/** Folds illness mods into `m`: numbers multiply, wobble takes the larger, eliminate only turns on. */
export function applyIllnessMods(life: Life, pack: ContentPack, m: Modifiers): void {
  for (const d of effective(life, pack)) {
    for (const [k, v] of Object.entries(d.minigame!.mods) as [keyof Modifiers, number | boolean][]) {
      if (k === 'wobble') m.wobble = Math.max(m.wobble, v as number)
      else if (k === 'eliminate') m.eliminate ||= v as boolean
      else m[k] *= v as number
    }
  }
}
