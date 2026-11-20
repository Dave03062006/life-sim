import type { ResultTier } from '../content/types'

export interface Theme {
  words?: Partial<Record<ResultTier, string>>
  /** The futsal ball that flies to where the shot ended up. */
  ball?: boolean
  /** The play button's label. */
  verb?: string
}

const WORDS: Record<ResultTier, string> = { great: 'Perfect!', good: 'Nice!', weak: 'Close', fail: 'Missed' }

export const THEMES: Record<string, Theme> = {
  futsal: { words: { great: 'Perfect strike!', good: 'Goal!', weak: 'Saved', fail: 'Wide' }, ball: true, verb: 'Kick' },
}

export const wordFor = (theme: string, tier: ResultTier): string => THEMES[theme]?.words?.[tier] ?? WORDS[tier]
