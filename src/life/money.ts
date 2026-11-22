import { packFor } from '../content'
import type { ContentPack } from '../content/types'
import { children as childrenOf } from './family'
import { formatRupiah } from './format'
import { UNI_FEE } from './school'
import { applyChanges } from './stats'
import type { Change, Life, Lifestyle, Wealth } from './types'
import { heldIn, salaryOf } from './work'

export const ALLOWANCE: Record<Wealth, number> = { struggling: 250_000, 'getting-by': 600_000, comfortable: 1_500_000, 'well-off': 3_000_000 }
// ALLOWANCE (a year, ages 6-11, doubled 12-17), LIFESTYLE costs (Rp 2 / 3,5 / 7 juta a month), CHILD_COST and INTEREST are game figures,
// sized against the BPS average net wage of Rp 3,09 juta a month (Feb 2025) but not taken from a single source.
export const LIFESTYLE: Record<Lifestyle, { label: string; cost: number; happiness: number; health: number }> = {
  frugal: { label: 'frugal', cost: 24_000_000, happiness: -2, health: -1 },
  normal: { label: 'normal', cost: 42_000_000, happiness: 0, health: 0 },
  comfortable: { label: 'comfortable', cost: 84_000_000, happiness: 3, health: 1 },
}
export const OWN_WAY_AGE = 25
export const CHILD_COST = 9_000_000 // a year per child under 18
export const INTEREST = 0.02 // on positive money, with the 'bank' flag
// BPJS Kesehatan mandiri kelas 3: Rp 42.000/month, Rp 7.000 covered by the government, members pay Rp 35.000 (Perpres 63/2022; bisnis.com 2025-09-01, besaran iuran BPJS Kesehatan)
export const BPJS_PREMIUM = 420_000
export const DEBT_STRESS = 5
export const LIVING_WITH_FAMILY = 'You live with your family. Costs start with your first full-time job or at 25.'

const BPJS_AGE = 18

export function closeMoneyYear(life: Life, pack: ContentPack): Life {
  const age = life.age
  const ownWay = life.ownWay || age >= OWN_WAY_AGE
  const fullTime = heldIn(life, pack)?.step.hours === 'full'
  const allowance = age >= 6 && age <= 17 && !fullTime ? ALLOWANCE[life.wealth] * (age >= 12 ? 2 : 1) : 0
  const salary = salaryOf(life, pack)
  const cut = life.belongings.reduce((sum, id) => sum + (pack.belongings.find((b) => b.id === id)?.livingCut ?? 0), 0)
  const living = ownWay ? Math.max(0, LIFESTYLE[life.lifestyle].cost - cut) : 0
  const children = childrenOf(life).filter((p) => p.age < 18).length * CHILD_COST
  const uni = life.school.at === 'uni' && life.school.funding === 'self' ? UNI_FEE : 0
  const bpjs = age >= BPJS_AGE && life.flags.includes('bpjs') ? BPJS_PREMIUM : 0
  const before = life.money + allowance + salary - living - children - uni - bpjs
  const interest = life.flags.includes('bank') && before > 0 ? Math.round((before * INTEREST) / 1000) * 1000 : 0

  const parts: [string, number][] = [
    ['allowance', allowance], ['salary', salary], ['interest', interest], ['living costs', living],
    ['child costs', children], ['university fees', uni], ['BPJS', bpjs],
  ]
  const shown = parts.filter(([, amount]) => amount > 0).map(([name, amount]) => `${name} ${formatRupiah(amount)}`)
  let next: Life = { ...life, ownWay }
  if (shown.length > 0) {
    const total = allowance + salary + interest - living - children - uni - bpjs
    const moods = ownWay ? LIFESTYLE[life.lifestyle] : LIFESTYLE.normal
    const after = applyChanges(next, [{ key: 'money', delta: total }, { key: 'happiness', delta: moods.happiness }, { key: 'health', delta: moods.health }])
    const changes: Change[] = [{ key: 'money', delta: total }]
    for (const key of ['happiness', 'health'] as const) if (after.stats[key] !== next.stats[key]) changes.push({ key, delta: after.stats[key] - next.stats[key] })
    next = { ...after, journal: [...after.journal, { age, kind: 'milestone', text: `This year: ${shown.join(', ')}.`, changes }] }
  }
  if (next.money < 0) {
    const stress = applyChanges(next, [{ key: 'stress', delta: DEBT_STRESS }])
    const delta = stress.stats.stress - next.stats.stress
    next = { ...stress, journal: [...stress.journal, { age, kind: 'milestone', text: `You are in debt: ${formatRupiah(next.money)}.`, changes: delta !== 0 ? [{ key: 'stress', delta }] : [] }] }
  }
  return next
}

export function setLifestyle(life: Life, lifestyle: Lifestyle): Life {
  if (!life.ownWay) throw new Error(LIVING_WITH_FAMILY)
  const text = `You switched to a ${LIFESTYLE[lifestyle].label} lifestyle.`
  return { ...life, lifestyle, journal: [...life.journal, { age: life.age, kind: 'milestone', text, changes: [] }] }
}

export function sellBlocked(life: Life, itemId: string, pack: ContentPack): string | null {
  if (!life.belongings.includes(itemId)) return "You don't own that."
  const held = heldIn(life, pack)
  const needs = held?.career.steps.find((s) => s.requires?.some((r) => r.kind === 'owns' && r.item === itemId))
  if (!needs) return null
  const title = held!.step.title.toLowerCase()
  return `Your job as ${/^[aeiou]/.test(title) ? 'an' : 'a'} ${title} needs it. Quit first.`
}

export function sell(life: Life, itemId: string, pack: ContentPack): Life {
  const blocked = sellBlocked(life, itemId, pack)
  if (blocked) throw new Error(blocked)
  const item = pack.belongings.find((b) => b.id === itemId)!
  const changes: Change[] = [{ key: 'money', delta: item.resale }]
  const text = `You sold your ${item.name.toLowerCase()} for ${formatRupiah(item.resale)}.`
  return { ...applyChanges(life, changes), belongings: life.belongings.filter((id) => id !== itemId), journal: [...life.journal, { age: life.age, kind: 'milestone', text, changes }] }
}

export const netWorth = (life: Life, pack: ContentPack = packFor(life.country)): number =>
  life.money + life.belongings.reduce((sum, id) => sum + (pack.belongings.find((b) => b.id === id)?.resale ?? 0), 0)
