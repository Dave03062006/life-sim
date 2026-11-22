import type { ContentPack } from '../content/types'
import { formatRupiah } from './format'
import { finished } from './requirements'
import { applyChanges } from './stats'
import type { Change, Life, SchoolLevel } from './types'

export const LENGTH: Record<SchoolLevel, number> = { tk: 2, sd: 6, smp: 3, sma: 3, smk: 3, 'paket-c': 1, uni: 4 }
export const STUDY_TARGET = 3
export const UNI_FEE = 10_000_000 // a year, paid when funding is 'self'
export const SCHOLARSHIP = { smarts: 80, grade: 80 }

export const LEVEL_NAME: Record<SchoolLevel, string> = { tk: 'TK', sd: 'SD', smp: 'SMP', sma: 'SMA', smk: 'SMK', 'paket-c': 'Paket C', uni: 'University' }

export function reportCard(life: Life): number {
  return Math.round(0.6 * life.stats.smarts + 0.4 * 100 * Math.min(1, life.school.effort / STUDY_TARGET))
}

/** The report card, the uni fee, then the year counted; the level ends when its years are done. */
export function closeSchoolYear(life: Life): Life {
  const { at, year, field, funding } = life.school
  if (at === null) return life
  let next = life
  const log = (text: string, changes: Change[]) => {
    const after = applyChanges(next, changes)
    const real = changes
      .map((c): Change => (c.key === 'money' || c.key === 'energy' ? c : { key: c.key, delta: after.stats[c.key] - next.stats[c.key] }))
      .filter((c) => c.delta !== 0)
    next = { ...after, journal: [...after.journal, { age: life.age, kind: 'milestone', text, changes: real }] }
  }

  let grade = life.school.grade
  if (at !== 'tk') { // too young at TK
    grade = reportCard(life)
    log(`Your report card: ${grade}.`, grade >= 80 ? [{ key: 'happiness', delta: 3 }] : grade < 40 ? [{ key: 'happiness', delta: -3 }, { key: 'stress', delta: 3 }] : [])
  }
  if (at === 'uni' && funding === 'self') log(`University fees: ${formatRupiah(UNI_FEE)}.`, [{ key: 'money', delta: -UNI_FEE }])

  const done = year + 1 >= LENGTH[at]
  if (done) {
    log(at === 'uni' ? `You graduated in ${field ?? 'your field'}.` : `You finished ${LEVEL_NAME[at]}.`, [])
  }
  const doneLevels = done && !next.school.done.includes(at) ? [...next.school.done, at] : next.school.done
  return { ...next, school: { ...next.school, at: done ? null : at, year: done ? 0 : year + 1, effort: 0, grade, done: doneLevels, funding: done ? null : funding, field: done ? null : field, degrees: done && at === 'uni' && field && !next.school.degrees.includes(field) ? [...next.school.degrees, field] : next.school.degrees } }
}

/** Compulsory school is automatic: TK at 4, SD at 6 (with or without TK), SMP straight after SD. SMP's end queues the fork. */
export function openSchoolYear(life: Life, pack: ContentPack): Life {
  const { school, age } = life
  let next = life
  if (school.at === null) {
    const enrol = (at: SchoolLevel, text?: string): void => {
      next = { ...next, school: { ...school, at, year: 0, effort: 0 }, journal: text ? [...next.journal, { age, kind: 'milestone', text, changes: [] }] : next.journal }
    }
    if (age >= 4 && age < 6 && !finished(life, 'tk', 'sd')) enrol('tk', 'You started TK. The crayons are shared, apparently.')
    else if (age >= 6 && age < 12 && !finished(life, 'sd')) enrol('sd') // the age-6 milestone says so
    else if (age >= 12 && finished(life, 'sd') && !finished(life, 'smp')) enrol('smp') // the age-12 milestone says so
    else if (school.done.at(-1) === 'smp' && !life.seenEvents.includes('after-smp') && pack.events.some((e) => e.id === 'after-smp')) {
      next = { ...next, seenEvents: [...next.seenEvents, 'after-smp'], pendingEvents: [...next.pendingEvents, { eventId: 'after-smp', cast: {} }] }
    }
  }
  return next
}

export function schoolLabel(life: Life): string | null {
  const { at, year, field } = life.school
  if (at === null) return null
  return at === 'uni' ? `University, ${field ?? 'undecided'}, year ${year + 1}` : `${LEVEL_NAME[at]}, year ${year + 1}`
}
