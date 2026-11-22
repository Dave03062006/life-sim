import type { Requirement } from '../content/types'
import type { Life, SchoolLevel, Schooling } from './types'

export const finished = (life: Life, ...levels: SchoolLevel[]): boolean => levels.some((l) => life.school.done.includes(l))

const STEPS: [number, SchoolLevel][] = [[4, 'tk'], [6, 'sd'], [12, 'smp'], [15, 'sma']]

/** The schooling a life of this age has by default: tk from 4, sd from 6, smp from 12, sma from 15, all four done at 18. */
export function schoolForAge(age: number): Schooling {
  const base = { effort: 0, grade: null, field: null, degrees: [], funding: null }
  const i = STEPS.findLastIndex(([from]) => age >= from)
  if (i < 0) return { ...base, at: null, year: 0, done: [] }
  if (age >= 18) return { ...base, at: null, year: 0, done: STEPS.map(([, l]) => l) }
  const [from, at] = STEPS[i]!
  return { ...base, at, year: age - from, done: STEPS.slice(0, i).map(([, l]) => l) }
}

/** The first unmet requirement's reason, or null. Stat requirements are left to callers that show an openNote. */
export function blockedBy(life: Life, reqs: readonly Requirement[]): string | null {
  for (const r of reqs) {
    const ok =
      r.kind === 'min-age' ? life.age >= r.age
      : r.kind === 'max-age' ? life.age <= r.age
      : r.kind === 'school' ? (life.school.at !== null && r.levels.includes(life.school.at)) || finished(life, ...r.levels)
      : r.kind === 'field' ? life.school.degrees.includes(r.field)
      : r.kind === 'flag' ? life.flags.includes(r.flag)
      : r.kind === 'no-flag' ? !life.flags.includes(r.flag)
      : r.kind === 'owns' ? life.belongings.includes(r.item)
      : r.kind === 'job' ? life.job !== null
      : true
    if (!ok) return r.reason
  }
  return null
}
