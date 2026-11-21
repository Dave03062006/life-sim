import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { QuizView } from './View'

it('marks the right answer and the pick in words, not only colour', () => {
  const view = { index: 0, total: 3, prompt: 'Q?', choices: ['A', 'B', 'C'], correct: 1, picked: 2, timeLeft: 5, timeTotal: 10 } as never
  render(<QuizView view={view} send={() => {}} />)
  expect(screen.getByRole('button', { name: /^B/ }).textContent).toContain('Right')
  expect(screen.getByRole('button', { name: /^C/ }).textContent).toContain('Your answer')
  expect(screen.getByRole('button', { name: /^A/ }).textContent).not.toMatch(/Right|Your answer/)
})
