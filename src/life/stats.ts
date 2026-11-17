import type { Change, Life, StatKey } from './types'

export const STAT_KEYS: readonly StatKey[] = ['health', 'happiness', 'smarts', 'looks', 'stress', 'reputation']
export const STAT_LABEL: Record<StatKey, string> = {
  health: 'Health', happiness: 'Happiness', smarts: 'Smarts', looks: 'Looks', stress: 'Stress', reputation: 'Reputation',
}

export const isBenefit = (key: Change['key'], delta: number): boolean => (key === 'stress' ? delta < 0 : delta > 0)

export const roundAway = (x: number): number => Math.sign(x) * Math.round(Math.abs(x))

export function applyChanges(life: Life, changes: readonly Change[]): Life {
  const stats = { ...life.stats }
  let money = life.money
  for (const { key, delta } of changes) {
    if (key === 'energy') continue
    if (key === 'money') money += delta
    else stats[key] = Math.min(100, Math.max(0, stats[key] + delta))
  }
  return { ...life, stats, money }
}
