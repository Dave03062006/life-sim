import type { CategoryId, Field, Life, Relation, SchoolLevel, StageId, StatKey } from '../life/types'

export type MinigameType = 'timing' | 'tapping' | 'memory' | 'quiz' | 'catch' | 'typing'
export type ResultTier = 'fail' | 'weak' | 'good' | 'great'
export type Requirement =
  | { kind: 'min-age'; age: number; reason: string }
  | { kind: 'stat'; key: StatKey; min: number; reason: string; openNote: string }
  | { kind: 'max-age'; age: number; reason: string }
  | { kind: 'school'; levels: SchoolLevel[]; reason: string } // enrolled in or finished one of these
  | { kind: 'field'; field: Field; reason: string } // finished uni in this field
  | { kind: 'flag'; flag: string; reason: string }
  | { kind: 'no-flag'; flag: string; reason: string }
  | { kind: 'owns'; item: string; reason: string }
  | { kind: 'job'; reason: string } // you hold a job
export interface CareerStep { title: string; salary: number; hours: 'full' | 'part'; requires?: Requirement[] }
export interface CareerDef { id: string; name: string; minAge: number; steps: CareerStep[]; business?: true; startCost?: number }
export interface BelongingDef { id: string; name: string; price: number; resale: number; energy?: number; livingCut?: number }
export interface ActivityDef {
  id: string
  category: CategoryId
  title: string
  description: string
  icon: string // an art id such as 'act-futsal'
  stages: StageId[]
  minigame?: { type: MinigameType; theme: string } // absent: the activity finishes at once as a Good result
  energy: number // cost; 0 for rest
  energyBack?: number // energy returned by a non-rest activity
  rest?: number // base energy restored by a rest activity
  money?: number // negative is a price, positive is earnings
  effects: Partial<Record<StatKey, number>> // benefits scale with the result; costs do not
  failPenalty?: Partial<Record<StatKey, number>>
  requires?: Requirement[]
  track?: 'enrolled' | 'work' // enrolled: shown only while at school; work: shown from 15 when not enrolled. Absent: always shown
  sets?: string // a flag set on a Good or Great result
  performance?: number // job performance, scaled like a benefit
  buys?: string // a belonging id, added when the activity finishes
  with?: Relation // one person of this relation joins (a woman first, so a grandmother before a grandfather); blocked when there is none
  together?: Relation[] // everyone of these relations joins, closeness +2 each
  makes?: 'friend' // a Good or Great result adds a new same-age friend of your gender
  lines: string | Record<ResultTier, string> // journal text
}
export interface ContentPack {
  id: Life['country']
  activities: ActivityDef[]
  milestones: Record<number, string>
  events: EventDef[]
  careers: CareerDef[]
  belongings: BelongingDef[]
}

export type Condition =
  | { kind: 'stat'; key: StatKey; min?: number; max?: number }
  | { kind: 'memory'; id: string } // you have this memory
  | { kind: 'no-memory'; id: string }
  | { kind: 'money'; min: number }
  | { kind: 'age'; min?: number; max?: number }
  | { kind: 'job' } // you hold a job
  | { kind: 'partnered'; years: number } // a spouse, or a partner for at least `years`
  | { kind: 'children'; max: number } // at most this many children
export interface Outcome {
  text: string // may use {role} placeholders, e.g. {friend}
  effects?: Partial<Record<StatKey, number>>
  money?: number
  closeness?: Partial<Record<string, number>> // role -> change
  memory?: { id: string; text: string } // recorded with the cast's people
  addPerson?: { relation: 'crush' | 'child' } // a crush matching life.interest (skipped when interest is null or none), or a newborn child; {child} in the text names them
  raise?: true // also pays 10% of the next career step's salary
  path?: string // a path move taken when this outcome lands; skipped if blocked
}
export type MannerKind = 'calm' | 'blunt' | 'joke'
export interface EventAction {
  id: string
  label: string
  chance: number // 0-100
  open?: { condition: Condition; note: string } // shown only when met; the note says why ("Open to you: your choice at 15")
  romance?: boolean // needs the romance question answered first
  outcomes: Record<'success' | 'mixed' | 'fail', Outcome>
}
export interface EventDef {
  id: string
  kind: 'choice' | 'news'
  stages: StageId[]
  weight: number
  big?: boolean
  repeat?: true // may be drawn again in a later year
  when?: Condition[]
  cast?: Record<string, Relation> // roles to fill, e.g. { friend: 'friend' }
  art?: string // banner key in the art manifest; defaults to the event id
  title: string
  text: string
  recall?: { memory: string; text: string } // a "Remembered" line added when you have the memory
  actions?: EventAction[] // choice events, 2-5
  manners?: { id: string; label: string; kind: MannerKind }[] // default: Calmly / Bluntly / With a joke
  news?: Outcome // news events
}
