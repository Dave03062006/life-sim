import { expect, it } from 'vitest'
import { formatRupiah } from '../../life/format'
import { questionsFor } from './questions'

it('draws five different questions from the chosen subjects, the same for the same seed', () => {
  const a = questionsFor({ kind: 'bank', subjects: ['maths'] }, 9, 5)
  expect(a).toEqual(questionsFor({ kind: 'bank', subjects: ['maths'] }, 9, 5))
  expect(new Set(a.map((q) => q.id)).size).toBe(5)
  expect(a.every((q) => q.subject === 'maths')).toBe(true)
})
it('gives generated questions four distinct choices, and arithmetic a right answer', () => {
  for (let seed = 0; seed < 50; seed++) {
    const qs = [...questionsFor({ kind: 'change' }, seed, 5), ...questionsFor({ kind: 'arithmetic' }, seed, 5)]
    expect(qs.filter((q) => new Set(q.choices).size !== 4)).toEqual([])
    const changes = qs.slice(0, 5).flatMap((q) => q.choices.map((c) => Number(c.replace(/\D/g, ''))))
    expect(changes.filter((n) => n <= 0 || n % 500 !== 0)).toEqual([])
    for (const q of qs.slice(5)) {
      const [, a, op, b] = q.prompt.match(/(\d+) (.) (\d+)/)!
      const right = op === '×' ? Number(a) * Number(b) : op === '+' ? Number(a) + Number(b) : Number(a) - Number(b)
      expect(q.choices[q.answer]).toBe(String(right))
    }
  }
})
it('makes change questions whose answer is right', () => {
  for (const q of questionsFor({ kind: 'change' }, 4, 5)) {
    const [, cost, paid] = q.prompt.match(/for Rp ([\d.]+)\. .*Rp ([\d.]+) note/)!.map((x) => Number(x.replaceAll('.', '')))
    expect(q.choices[q.answer]).toBe(formatRupiah(paid! - cost!))
  }
})
