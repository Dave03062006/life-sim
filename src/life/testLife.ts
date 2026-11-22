import type { Life } from './types'

export function testLife(overrides: Partial<Life> = {}): Life {
  return {
    version: 4,
    id: 'life-test',
    rng: 1,
    country: 'indonesia',
    name: 'Raka Pratama',
    gender: 'male',
    city: 'Surabaya',
    age: 16,
    stats: { health: 58, happiness: 71, smarts: 64, looks: 49, stress: 35, reputation: 62 },
    money: 215000,
    energySpent: 0,
    restsThisYear: 0,
    doneThisYear: {},
    journal: [],
    people: [
      { id: 'p-1', name: 'Siti', relation: 'mother', gender: 'female', age: 42, closeness: 70 },
      { id: 'p-2', name: 'Budi', relation: 'father', gender: 'male', age: 45, closeness: 70 },
      { id: 'p-3', name: 'Dimas', relation: 'friend', gender: 'male', age: 16, closeness: 60 },
    ],
    memories: [],
    interest: null,
    pendingEvents: [],
    seenEvents: [],
    spentWith: [],
    wealth: 'getting-by',
    death: null,
    school: { at: 'sma', year: 1, effort: 0, grade: null, done: ['tk', 'sd', 'smp'], field: null, degrees: [], funding: null },
    job: null,
    lifestyle: 'normal',
    ownWay: false,
    flags: [],
    belongings: [],
    ...overrides,
  }
}
