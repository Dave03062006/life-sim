import type { ActivityDef, ContentPack, ResultTier } from '../content/types'
import { OVERWORK_HEALTH, OVERWORK_STRESS, overworkPoints, repeatScale, restGain } from './energy'
import { formatRupiah } from './format'
import { stageOf } from './stages'
import { applyChanges, isBenefit, roundAway } from './stats'
import type { CategoryId, Change, JournalEntry, Life, StatKey } from './types'

export const GOOD_SCORE = 0.6
export const SKIP_SCORE = 0.3
export const TIER_SCALE: Record<ResultTier, number> = { fail: 0, weak: 0.5, good: 1, great: 1.5 }

export function tierOf(score: number): ResultTier {
  return score < 0.25 ? 'fail' : score < 0.5 ? 'weak' : score < 0.85 ? 'good' : 'great'
}

export interface ActivityOffer {
  def: ActivityDef
  timesDone: number
  blocked: string | null
  openNote: string | null
  energyGain: number
  overwork: boolean
}

function check(life: Life, def: ActivityDef): { blocked: string | null; openNote: string | null } {
  const reqs = def.requires ?? []
  for (const r of reqs) if (r.kind === 'min-age' && life.age < r.age) return { blocked: r.reason, openNote: null }
  let openNote: string | null = null
  for (const r of reqs) {
    if (r.kind !== 'stat') continue
    if (life.stats[r.key] < r.min) return { blocked: r.reason, openNote: null }
    openNote ??= r.openNote
  }
  const price = -(def.money ?? 0)
  if (price > life.money) return { blocked: `You need ${formatRupiah(price)}. You have ${formatRupiah(life.money)}.`, openNote: null }
  return { blocked: null, openNote }
}

const gainOf = (life: Life, def: ActivityDef): number =>
  def.rest !== undefined ? restGain(life, def.rest) : Math.min(def.energyBack ?? 0, life.energySpent)

export function offersFor(life: Life, category: CategoryId, pack: ContentPack): ActivityOffer[] {
  const stage = stageOf(life.age).id
  return pack.activities
    .filter((d) => d.category === category && d.stages.includes(stage))
    .map((def) => ({
      def,
      timesDone: life.doneThisYear[def.id] ?? 0,
      ...check(life, def),
      energyGain: gainOf(life, def),
      overwork: overworkPoints(life, def.energy) > 0,
    }))
}

export interface ActivityOutcome { life: Life; tier: ResultTier; entry: JournalEntry }

export function finishActivity(life: Life, def: ActivityDef, score: number): ActivityOutcome {
  const { blocked } = check(life, def)
  if (blocked) throw new Error(`${def.id} is blocked: ${blocked}`)
  const tier = tierOf(score)
  const timesDone = life.doneThisYear[def.id] ?? 0
  const scale = TIER_SCALE[tier] * repeatScale(timesDone)

  const over = overworkPoints(life, def.energy)
  const gain = gainOf(life, def)
  const energySpent = Math.max(0, life.energySpent + def.energy - gain)

  const merged = new Map<StatKey, number>()
  const add = (key: StatKey, delta: number) => merged.set(key, (merged.get(key) ?? 0) + delta)
  for (const [key, delta] of Object.entries(def.effects) as [StatKey, number][]) {
    if (!isBenefit(key, delta)) add(key, delta)
    else if (tier !== 'fail') add(key, Math.sign(delta) * Math.max(1, Math.abs(roundAway(delta * scale))))
  }
  if (tier === 'fail') for (const [key, delta] of Object.entries(def.failPenalty ?? {}) as [StatKey, number][]) add(key, delta)
  if (over > 0) {
    add('stress', OVERWORK_STRESS * over)
    add('health', OVERWORK_HEALTH * over)
  }

  const changes: Change[] = [...merged].filter(([, d]) => d !== 0).map(([key, delta]) => ({ key, delta }))
  const m = def.money ?? 0
  const moneyDelta = m > 0 ? Math.round((m * scale) / 1000) * 1000 : m
  if (moneyDelta !== 0) changes.push({ key: 'money', delta: moneyDelta })
  if (gain > 0) changes.push({ key: 'energy', delta: gain })

  let text = typeof def.lines === 'string' ? def.lines : def.lines[tier]
  if (over > 0) text += ' You were already worn out.'
  if (def.rest !== undefined && gain === 0) text += life.energySpent === 0 ? ' You were already rested.' : ' Rest is not helping any more this year.'

  const next = applyChanges(life, changes)
  const entry: JournalEntry = { age: life.age, kind: 'activity', text, changes }
  return {
    tier,
    entry,
    life: {
      ...next,
      energySpent,
      restsThisYear: life.restsThisYear + (def.rest !== undefined ? 1 : 0),
      doneThisYear: { ...life.doneThisYear, [def.id]: timesDone + 1 },
      journal: [...life.journal, entry],
    },
  }
}
