export type StatKey = 'health' | 'happiness' | 'smarts' | 'looks' | 'stress' | 'reputation'
export type Stats = Record<StatKey, number>
export type StageId = 'baby' | 'small-child' | 'child' | 'early-teen' | 'late-teen' | 'young-adult' | 'adult' | 'senior'
export type CategoryId = 'school' | 'mind' | 'body' | 'health' | 'people' | 'money' | 'fun' | 'rest'
export type Gender = 'female' | 'male'
export interface Change { key: StatKey | 'money' | 'energy'; delta: number }
export interface JournalEntry { age: number; kind: 'milestone' | 'activity'; text: string; changes: Change[] }
export interface Life {
  version: 1
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
}
