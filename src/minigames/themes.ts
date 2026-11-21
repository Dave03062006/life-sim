import type { ResultTier } from '../content/types'

export interface Theme {
  words?: Partial<Record<ResultTier, string>>
  /** The futsal ball that flies to where the shot ended up. */
  ball?: boolean
  /** The play button's label. */
  verb?: string
  /** Overrides the type's instruction. */
  instruction?: string
  /** Labels on Memory's four pads; default 1 to 4. */
  pads?: [string, string, string, string]
}

const WORDS: Record<ResultTier, string> = { great: 'Perfect!', good: 'Nice!', weak: 'Close', fail: 'Missed' }

export const THEMES: Record<string, Theme> = {
  futsal: { words: { great: 'Perfect strike!', good: 'Goal!', weak: 'Saved', fail: 'Wide' }, ball: true, verb: 'Kick' },
  'group-project': { pads: ['Plan', 'Draw', 'Write', 'Present'] },
  library: { pads: ['History', 'Novels', 'Science', 'Comics'] },
  chess: { pads: ['Knight', 'Bishop', 'Rook', 'Queen'] },
  silat: { pads: ['Block', 'Strike', 'Kick', 'Sweep'] },
  'warung-shift': { pads: ['Nasi', 'Soto', 'Es teh', 'Kerupuk'] },
  comics: { pads: ['Hero', 'Villain', 'Panel', 'Speech'] },
}

export const wordFor = (theme: string, tier: ResultTier): string => THEMES[theme]?.words?.[tier] ?? WORDS[tier]
