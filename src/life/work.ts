import { packFor } from '../content'
import type { CareerDef, CareerStep, ContentPack, Requirement } from '../content/types'
import { formatRupiah } from './format'
import type { PathAction } from './path'
import { blockedBy } from './requirements'
import { applyChanges } from './stats'
import type { Change, Job, Life } from './types'

export const RESERVE = { full: 4, part: 2 }
export const PERFORMANCE_START = 50
export const PERFORMANCE_DRIFT = -10
export const PROMOTE_AT = 70
export const LET_GO_BELOW = 20
export const PROMOTE_AFTER = 2
export const RETIRE_AGE = 58
const IN_SCHOOL = ['tk', 'sd', 'smp', 'sma', 'smk']
const NO_JOB = "You don't have a job."

interface Held { career: CareerDef; step: CareerStep }

function heldIn(life: Life, pack: ContentPack): Held | null {
  if (!life.job) return null
  const career = pack.careers.find((c) => c.id === life.job!.careerId)
  const step = career?.steps[life.job.step]
  return career && step ? { career, step } : null
}

export const currentStep = (life: Life): Held | null => heldIn(life, packFor(life.country))
export const jobLabel = (life: Life): string | null => currentStep(life)?.step.title ?? null
/** The next rung of the ladder you are on, if any. */
export const nextStepOf = (life: Life): CareerStep | null => {
  const held = currentStep(life)
  return held ? (held.career.steps[life.job!.step + 1] ?? null) : null
}

/** A year's pay in whole Rupiah. A business pays by how well it did; a job pays its step. */
export function salaryOf(life: Life, pack: ContentPack): number {
  const held = heldIn(life, pack)
  if (!held || !life.job) return 0
  if (!held.career.business) return held.step.salary
  return Math.round((held.step.salary * (0.4 + (life.job.performance / 100) * 1.2)) / 1000) * 1000
}

// blockedBy leaves stat requirements to callers, so they are checked here
function unmet(life: Life, reqs: readonly Requirement[]): string | null {
  return blockedBy(life, reqs) ?? reqs.find((r) => r.kind === 'stat' && life.stats[r.key] < r.min)?.reason ?? null
}

function jobMove(life: Life, career: CareerDef): PathAction {
  const entry = career.steps[0]!
  const cost = career.startCost ?? 0
  const blocked =
    life.job?.careerId === career.id ? 'You already work here.'
    : entry.hours === 'full' && life.school.at !== null && IN_SCHOOL.includes(life.school.at) ? 'Finish or leave school first.'
    : life.age < career.minAge ? `From age ${career.minAge}.`
    : unmet(life, entry.requires ?? [])
      ?? (life.money < cost ? `You need ${formatRupiah(cost)}. You have ${formatRupiah(life.money)}.` : null)
  const pay = `${entry.title}: ${formatRupiah(entry.salary)} a year, ${entry.hours === 'full' ? 'full-time' : 'part-time'}.`
  return { id: `job:${career.id}`, label: career.name, detail: cost > 0 ? `${pay} Costs ${formatRupiah(cost)} to start.` : pay, blocked }
}

/** One 'job:<careerId>' move per career, at its entry step. */
export const jobBoard = (life: Life, pack: ContentPack): PathAction[] => pack.careers.map((c) => jobMove(life, c))

/** Quit and retire, shown with the other moves. */
export function workMoves(life: Life, pack: ContentPack): PathAction[] {
  const has = heldIn(life, pack) !== null
  return [
    { id: 'quit', label: 'Quit your job', detail: 'Leave work. You can apply again later.', blocked: has ? null : NO_JOB },
    { id: 'retire', label: 'Retire', detail: 'Stop working for good.', blocked: life.age < RETIRE_AGE ? `You can retire from ${RETIRE_AGE}.` : has ? null : NO_JOB },
  ]
}

/** The move up one step: used by the promotion event, never listed. */
export function promoteMove(life: Life, pack: ContentPack): PathAction {
  const held = heldIn(life, pack)
  const next = held?.career.steps[life.job!.step + 1]
  const blocked = !held ? NO_JOB : !next ? 'You are at the top of this ladder.' : unmet(life, next.requires ?? [])
  return { id: 'promote', label: 'Take the promotion', detail: next?.title ?? '', blocked }
}

export const isWorkMove = (id: string): boolean => id.startsWith('job:') || id === 'quit' || id === 'retire' || id === 'promote'

function note(life: Life, text: string, changes: Change[] = []): Life {
  return { ...applyChanges(life, changes), journal: [...life.journal, { age: life.age, kind: 'milestone', text, changes }] }
}

/** Takes an open work move (the caller has checked it is open) and journals it. */
export function takeWorkMove(life: Life, id: string, pack: ContentPack): Life {
  const held = heldIn(life, pack)
  if (id === 'quit') return { ...note(life, `You quit your job as ${held!.step.title}.`), job: null }
  if (id === 'retire') return { ...note(life, `You retired from your job as ${held!.step.title}.`), job: null }
  if (id === 'promote') {
    const next = held!.career.steps[life.job!.step + 1]!
    const job: Job = { ...life.job!, step: life.job!.step + 1, performance: PERFORMANCE_START, years: 0 }
    return { ...note(life, `You were promoted to ${next.title}.`), job }
  }
  const career = pack.careers.find((c) => `job:${c.id}` === id)!
  const entry = career.steps[0]!
  const left = held ? note(life, `You left your job as ${held.step.title}.`) : life
  const cost = career.startCost ?? 0
  const started = note(left, `You started work as ${entry.title}.`, cost > 0 ? [{ key: 'money', delta: -cost }] : [])
  return { ...started, job: { careerId: career.id, step: 0, performance: PERFORMANCE_START, years: 0 }, ownWay: started.ownWay || entry.hours === 'full' }
}

/** Salary, performance drift and a year in the step; then a promotion offer, or being let go. */
export function closeWorkYear(life: Life, pack: ContentPack): Life {
  const held = heldIn(life, pack)
  if (!held || !life.job) return life
  const pay = salaryOf(life, pack)
  let next = pay > 0 ? note(life, `Your salary: ${formatRupiah(pay)}.`, [{ key: 'money', delta: pay }]) : life
  const job: Job = { ...life.job, performance: Math.min(100, Math.max(0, life.job.performance + PERFORMANCE_DRIFT)), years: life.job.years + 1 }
  next = { ...next, job }
  if (job.performance >= PROMOTE_AT && job.years >= PROMOTE_AFTER && promoteMove(next, pack).blocked === null) {
    return { ...next, pendingEvents: [...next.pendingEvents, { eventId: 'promotion', cast: {} }] }
  }
  if (job.performance < LET_GO_BELOW) {
    const text = `You were let go from your job as ${held.step.title}.`
    const memories = next.memories.some((m) => m.id === 'let-go') ? next.memories : [...next.memories, { id: 'let-go', age: life.age, text, people: [] }]
    return { ...note(next, text), job: null, memories }
  }
  return next
}
