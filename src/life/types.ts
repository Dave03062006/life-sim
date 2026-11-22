export type StatKey = 'health' | 'happiness' | 'smarts' | 'looks' | 'stress' | 'reputation'
export type Stats = Record<StatKey, number>
export type StageId = 'baby' | 'small-child' | 'child' | 'early-teen' | 'late-teen' | 'young-adult' | 'adult' | 'senior'
export type CategoryId = 'school' | 'mind' | 'body' | 'health' | 'people' | 'money' | 'fun' | 'rest'
export type Gender = 'female' | 'male'
export interface Change { key: StatKey | 'money' | 'energy'; delta: number }
export type Relation = 'mother' | 'father' | 'sibling' | 'grandparent' | 'friend' | 'crush' | 'partner'
export interface Person { id: string; name: string; relation: Relation; gender: Gender; age: number; closeness: number }
export interface Memory { id: string; age: number; text: string; people: string[] }   // people = person ids
export type Interest = 'women' | 'men' | 'both' | 'none'
export interface PendingEvent { eventId: string; cast: Record<string, string> }       // role -> person id
export interface JournalEntry { age: number; kind: 'milestone' | 'activity' | 'event' | 'memory'; text: string; changes: Change[]; people?: { id: string; delta: number }[] } // people: real closeness changes
export type Wealth = 'struggling' | 'getting-by' | 'comfortable' | 'well-off'
export interface Death { age: number; cause: string }
export interface Life {
  version: 3
  id: string
  rng: number               // the seeded generator's position
  country: 'indonesia'
  name: string
  gender: Gender
  city: string
  age: number
  stats: Stats
  money: number             // whole Rupiah; may be negative
  energySpent: number       // this year; may exceed the budget (overwork)
  restsThisYear: number
  doneThisYear: Record<string, number>
  journal: JournalEntry[]
  people: Person[]
  memories: Memory[]
  interest: Interest | null       // null until the romance question is answered
  pendingEvents: PendingEvent[]
  seenEvents: string[]            // event ids already drawn in this life
  spentWith: string[]             // person ids you spent time with this year
  wealth: Wealth                  // the family you were born into
  death: Death | null             // null while alive
}
