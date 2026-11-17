import type { Life } from './types'

export function testLife(overrides: Partial<Life> = {}): Life {
  return {
    version: 1,
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
    ...overrides,
  }
}
