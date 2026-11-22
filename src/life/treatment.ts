import type { ActivityDef, ContentPack, IllnessDef, TreatmentDef } from '../content/types'
import { GOOD_SCORE, finishActivity, type ActivityOffer } from './activities'
import { overworkPoints } from './energy'
import { formatRupiah } from './format'
import { STAGES } from './stages'
import type { Illness, JournalEntry, Life } from './types'

export const FAMILY_PAYS_UNDER = 18

export function treatmentCost(life: Life, t: TreatmentDef): number {
  return life.age < FAMILY_PAYS_UNDER || life.flags.includes('bpjs') ? 0 : t.cost
}

const lower = (name: string): string => (/^.[a-z]/.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name)
const idOf = (illnessId: string, t: TreatmentDef): string => `treat:${illnessId}:${t.id}`

function lineOf(def: IllnessDef, t: TreatmentDef): string {
  const name = lower(def.name)
  if (t.line) return t.line
  if (t.effect === 'cure') return `You were treated for ${name} and got better.`
  if (t.effect === 'control') return `You kept ${name} under control this year.`
  return `You rested and took care of yourself. ${def.name} was easier to bear.`
}

function activityOf(life: Life, def: IllnessDef, t: TreatmentDef): ActivityDef {
  return {
    id: idOf(def.id, t), category: 'health', title: t.label,
    description: life.age < FAMILY_PAYS_UNDER ? 'Your family pays.' : life.flags.includes('bpjs') ? 'BPJS covers it.' : formatRupiah(t.cost),
    icon: 'act-checkup', stages: STAGES.map((s) => s.id), energy: t.energy, money: -treatmentCost(life, t), effects: {}, lines: lineOf(def, t),
  }
}

function blockedFor(life: Life, i: Illness, t: TreatmentDef, used: number): string | null {
  if (t.stages && !t.stages.includes(i.stage)) return t.effect === 'cure' ? 'Found too late for surgery.' : 'Not at this stage.'
  if (used > 0) return 'Controlled this year. Take it again next year.'
  const price = treatmentCost(life, t)
  if (price > 0 && price > life.money) return `You need ${formatRupiah(price)}. You have ${formatRupiah(life.money)}. BPJS would cover it.`
  return null
}

export function treatmentOffers(life: Life, pack: ContentPack): ActivityOffer[] {
  return life.illnesses.flatMap((i) => {
    const def = pack.illnesses.find((d) => d.id === i.id)
    if (!def || !i.known || i.treated === 'cured') return []
    return def.treatments.flatMap((t): ActivityOffer[] => {
      const act = activityOf(life, def, t)
      const used = life.doneThisYear[act.id] ?? 0
      if (used > 0 && t.effect !== 'control') return []
      return [{ def: act, timesDone: used, blocked: blockedFor(life, i, t, used), openNote: null, energyGain: 0, overwork: overworkPoints(life, t.energy) > 0 }]
    })
  })
}

export function treat(life: Life, illnessId: string, treatmentId: string, pack: ContentPack): { life: Life; entry: JournalEntry } {
  const t = pack.illnesses.find((d) => d.id === illnessId)?.treatments.find((x) => x.id === treatmentId)
  const offer = treatmentOffers(life, pack).find((o) => o.def.id === `treat:${illnessId}:${treatmentId}`)
  if (!t || !offer) throw new Error(`no treatment ${illnessId}:${treatmentId}`)
  if (offer.blocked) throw new Error(`${offer.def.id} is blocked: ${offer.blocked}`)
  const done = finishActivity(life, offer.def, GOOD_SCORE)
  const illnesses = t.effect === 'cure'
    ? done.life.illnesses.filter((i) => i.id !== illnessId)
    : done.life.illnesses.map((i) => (i.id === illnessId ? { ...i, treated: t.effect === 'control' ? 'controlled' as const : 'eased' as const } : i))
  return { life: { ...done.life, illnesses }, entry: done.entry }
}
