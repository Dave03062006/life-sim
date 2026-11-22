import type { ResultTier } from '../content/types'
import type { QuizSource } from './quiz/questions'

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
  /** Where Quiz draws its questions; default the general bank. */
  quiz?: QuizSource
  /** How many questions Quiz asks; default 5. */
  count?: number
  /** Labels on Catch's falling items; default Good and Bad. */
  catchItems?: { good: string; bad: string }
  /** Plain lowercase words Typing draws from (at least 8); default a general list. `words` is taken by the result words. */
  typingWords?: string[]
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
  'study-exam': { quiz: { kind: 'bank', subjects: ['maths', 'science', 'english', 'indonesia'] } },
  bimbel: { quiz: { kind: 'bank', subjects: ['maths', 'english'] } },
  'new-friend': { quiz: { kind: 'bank', subjects: ['chat'] } },
  'sell-snacks': { quiz: { kind: 'change' } },
  'eat-better': { catchItems: { good: 'Sayur', bad: 'Gorengan' } },
  cook: { catchItems: { good: 'Bawang', bad: 'Gosong' } },
  homework: { typingWords: ['essay', 'chapter', 'answer', 'notes', 'lesson', 'teacher', 'pencil', 'homework'] },
  english: { typingWords: ['because', 'friend', 'weather', 'morning', 'window', 'travel', 'question', 'kitchen'] },
  code: { typingWords: ['const', 'return', 'true', 'false', 'function', 'array', 'string', 'import'] },
  diary: { typingWords: ['happy', 'tired', 'proud', 'nervous', 'calm', 'excited', 'lonely', 'hopeful'] },
  'class-test': { quiz: { kind: 'bank', subjects: ['maths', 'science', 'english', 'indonesia', 'general'], levels: ['sd', 'smp'] } },
  'hobby-class': { pads: ['Wax', 'Dye', 'Pattern', 'Dry'] },
  'evening-class': { pads: ['Read', 'Note', 'Ask', 'Review'] },
  'read-ahead': { pads: ['Title', 'Page', 'Picture', 'Word'] },
  'pitch-idea': { quiz: { kind: 'bank', subjects: ['general', 'maths', 'english'] } },
  tutor: { quiz: { kind: 'arithmetic' } },
  'entrance-test': { quiz: { kind: 'bank', subjects: ['maths', 'science', 'english', 'indonesia', 'general'] }, count: 10 },
}

export const wordFor = (theme: string, tier: ResultTier): string => THEMES[theme]?.words?.[tier] ?? WORDS[tier]
