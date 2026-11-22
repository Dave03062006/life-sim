import type { Life, Memory, Person, Stats } from './types'

export interface LifeSummary {
  name: string
  age: number
  ended: 'died' | 'unfinished'
  cause: string | null
  memories: Memory[]
  stats: Stats
  netWorth: number // money for now; belongings join in Plan 5
  leftBehind: Person[] // living people, closest first
  closing: string
}

export const CLOSING_LINES: Record<'young' | 'middle' | 'old' | 'unfinished', string[]> = {
  young: ['It was too short, and it still mattered.', 'A short life, and the people in it will carry it.'],
  middle: ['A life in full swing, with much done and more hoped for.', 'You left your mark on the years you had.'],
  old: ['A long life, lived all the way through.', 'So many years, and so many people who knew you.'],
  unfinished: ['This story was left for another time.', 'The rest of this life is still unwritten.'],
}

export function summaryOf(life: Life): LifeSummary {
  const band = !life.death ? 'unfinished' : life.age < 30 ? 'young' : life.age >= 70 ? 'old' : 'middle'
  const lines = CLOSING_LINES[band]
  return {
    name: life.name,
    age: life.age,
    ended: life.death ? 'died' : 'unfinished',
    cause: life.death?.cause ?? null,
    memories: life.memories.toSorted((a, b) => a.age - b.age),
    stats: life.stats,
    netWorth: life.money,
    leftBehind: life.people.toSorted((a, b) => b.closeness - a.closeness),
    closing: lines[Math.abs(life.rng) % lines.length]!, // stable for a given life
  }
}
