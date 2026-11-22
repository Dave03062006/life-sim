import { QUESTIONS } from '../../content/quiz/bank'
import type { QuizQuestion, QuizSubject } from '../../content/quiz/types'
import { createRng, type Rng } from '../../engine/random'
import { formatRupiah } from '../../life/format'

export type QuizSource = { kind: 'bank'; subjects: QuizSubject[]; levels?: QuizQuestion['level'][] } | { kind: 'change' } | { kind: 'arithmetic' }
type Choices = QuizQuestion['choices']

/** Shuffles the choices and moves the answer index with them. */
const shuffled = (q: QuizQuestion, rng: Rng): QuizQuestion => {
  const order = rng.shuffle([0, 1, 2, 3] as const)
  return { ...q, choices: order.map((i) => q.choices[i]) as Choices, answer: order.indexOf(q.answer) as QuizQuestion['answer'] }
}

/** The right answer first, then three distinct positive wrong ones at some of the offsets. */
const withWrong = (right: number, offsets: number[], rng: Rng, show: (n: number) => string): Choices => {
  const wrong = rng.shuffle(offsets.map((d) => right + d).filter((n) => n > 0)).slice(0, 3)
  return [right, ...wrong].map(show) as Choices
}

const change = (rng: Rng, i: number): QuizQuestion => {
  const n = rng.int(1, 5)
  const total = n * 500 * rng.int(4, 16) // Rp 2.000 to Rp 7.500 a snack
  const note = rng.pick([10000, 20000, 50000].filter((x) => x > total))
  return {
    id: `change-${i}`, subject: 'maths', level: 'sd', answer: 0,
    prompt: `You sell ${n} ${n === 1 ? 'snack' : 'snacks'} for ${formatRupiah(total)}. They pay with a ${formatRupiah(note)} note. How much change?`,
    choices: withWrong(note - total, [-1500, -1000, -500, 500, 1000, 1500], rng, formatRupiah),
  }
}

const arithmetic = (rng: Rng, i: number): QuizQuestion => {
  const op = rng.pick(['×', '+', '−'] as const)
  const a = op === '×' ? rng.int(2, 13) : rng.int(op === '−' ? 11 : 10, 100)
  const b = op === '×' ? rng.int(2, 13) : rng.int(10, op === '−' ? a : 100) // a − b stays positive
  const right = op === '×' ? a * b : op === '+' ? a + b : a - b
  return {
    id: `arithmetic-${i}`, subject: 'maths', level: 'sd', answer: 0,
    prompt: `What is ${a} ${op} ${b}?`,
    choices: withWrong(right, [-10, -2, -1, 1, 2, 10], rng, String),
  }
}

export function questionsFor(source: QuizSource, seed: number, count: number): QuizQuestion[] {
  const rng = createRng(seed)
  const picked =
    source.kind === 'bank'
      ? rng.shuffle(QUESTIONS.filter((q) => source.subjects.includes(q.subject) && (source.levels?.includes(q.level) ?? true))).slice(0, count)
      : Array.from({ length: count }, (_, i) => (source.kind === 'change' ? change : arithmetic)(rng, i))
  return picked.map((q) => shuffled(q, rng))
}
