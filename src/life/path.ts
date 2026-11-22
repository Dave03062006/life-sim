import type { ContentPack } from '../content/types'
import { formatRupiah } from './format'
import { blockedBy, finished } from './requirements'
import { LEVEL_NAME, SCHOLARSHIP, UNI_FEE } from './school'
import type { Field, Life, SchoolLevel, Schooling } from './types'

export interface PathAction { id: string; label: string; detail: string; blocked: string | null }

const FIELDS: Field[] = ['engineering', 'health', 'education', 'business', 'arts']
const UPPER: SchoolLevel[] = ['sma', 'smk', 'paket-c']

function fundingOf(life: Life): NonNullable<Schooling['funding']> {
  if (life.stats.smarts >= SCHOLARSHIP.smarts && (life.school.grade ?? 0) >= SCHOLARSHIP.grade) return 'scholarship'
  return life.wealth === 'comfortable' || life.wealth === 'well-off' ? 'family' : 'self'
}

const FUNDING_DETAIL = { scholarship: 'Scholarship: no fees.', family: 'Your family pays.', self: `${formatRupiah(UNI_FEE)} a year.` }
const FUNDING_LINE = { scholarship: 'You won a scholarship.', family: 'Your family is paying.', self: 'You are paying the fees yourself.' }

function upper(life: Life, at: 'sma' | 'smk'): PathAction {
  const blocked =
    !finished(life, 'smp') ? 'Finish SMP first.'
    : life.school.at !== null ? 'You are already at school.'
    : finished(life, ...UPPER) ? 'You have already finished upper secondary school.'
    : null
  return { id: at, label: `Go on to ${LEVEL_NAME[at]}`, detail: at === 'sma' ? 'Three years of general studies.' : 'Three years of vocational training.', blocked }
}

function leaveSchool(life: Life): PathAction {
  const { at } = life.school
  const blocked =
    at === 'sma' || at === 'smk' ? null
    : at === 'tk' || at === 'sd' || at === 'smp' ? 'You can leave school once SMP is finished.'
    : 'You are not in SMA or SMK.'
  return { id: 'leave-school', label: 'Leave school', detail: 'Start working instead.', blocked }
}

function paketC(life: Life): PathAction {
  const blocked =
    life.school.at !== null ? 'You are already at school.'
    : life.age < 18 ? 'Paket C is from age 18.'
    : finished(life, ...UPPER) ? 'You have already finished upper secondary school.'
    : null
  return { id: 'paket-c', label: 'Study for Paket C', detail: 'One year. It counts as finishing upper secondary school.', blocked }
}

function uni(life: Life, field: Field): PathAction {
  const blocked =
    blockedBy(life, [{ kind: 'flag', flag: 'passed-entrance', reason: 'Pass the entrance test first.' }])
    ?? (!finished(life, ...UPPER) ? 'Finish SMA, SMK or Paket C first.' : null)
    ?? (life.school.at !== null ? 'You are already at school.' : null)
    ?? (life.school.degrees.includes(field) ? 'You already have this degree.' : null)
  return { id: `uni:${field}`, label: `Study ${field} at university`, detail: FUNDING_DETAIL[fundingOf(life)], blocked }
}

function leaveUni(life: Life): PathAction {
  return { id: 'leave-uni', label: 'Leave university', detail: 'Stop studying, and stop paying.', blocked: life.school.at === 'uni' ? null : 'You are not at university.' }
}

/** Every school move with its state; closed ones carry their reason. Work moves join in Task 3. */
export function pathActions(life: Life, _pack: ContentPack): PathAction[] {
  return [upper(life, 'sma'), upper(life, 'smk'), leaveSchool(life), paketC(life), ...FIELDS.map((f) => uni(life, f)), leaveUni(life)]
}

/** Takes an open move, and writes it into the journal. Throws on a blocked or unknown id. */
export function takePath(life: Life, id: string, pack: ContentPack): Life {
  const action = pathActions(life, pack).find((a) => a.id === id)
  if (!action) throw new Error(`Unknown path move ${id}`)
  if (action.blocked) throw new Error(`${id} is blocked: ${action.blocked}`)
  const enrol = (at: SchoolLevel, over: Partial<Schooling> = {}): Schooling => ({ ...life.school, at, year: 0, effort: 0, ...over })
  let school: Schooling
  let text: string
  if (id === 'sma' || id === 'smk' || id === 'paket-c') {
    school = enrol(id)
    text = `You started ${LEVEL_NAME[id]}.`
  } else if (id.startsWith('uni:')) {
    const field = id.slice(4) as Field
    const funding = fundingOf(life)
    school = enrol('uni', { field, funding })
    text = `You started university: ${field}. ${FUNDING_LINE[funding]}`
  } else {
    school = { ...life.school, at: null, year: 0, effort: 0, funding: null, field: null }
    text = id === 'leave-uni' ? 'You left university.' : 'You left school.'
  }
  return { ...life, school, journal: [...life.journal, { age: life.age, kind: 'milestone', text, changes: [] }] }
}
