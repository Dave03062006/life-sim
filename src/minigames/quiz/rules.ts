import type { QuizQuestion } from '../../content/quiz/types'
import { createRng } from '../../engine/random'
import { STEP, type GameRules, type Modifiers } from '../framework'
import { THEMES } from '../themes'
import { questionsFor } from './questions'

const PAUSE = Math.round(0.6 / STEP)
export interface QuizView { index: number; total: number; prompt: string; choices: string[]; picked: number | null; correct: number; timeLeft: number; timeTotal: number; done: boolean }
export interface QuizState {
  mods: Modifiers
  questions: QuizQuestion[]
  shown: number[][] // per question, the indices of the choices shown, in order
  answers: number[] // the position picked for each answered question
  steps: number
  pause: number // steps left in the pause after an answer
}

const count = (s: QuizState) => s.questions.length
// four seconds a question: 20 for the usual five
const totalSteps = (s: QuizState) => Math.round((4 * count(s) * s.mods.time * s.mods.preview) / STEP)
const isDone = (s: QuizState) => s.answers.length >= count(s) || s.steps >= totalSteps(s)
const showingAnswer = (s: QuizState) => s.pause > 0 || s.answers.length >= count(s)
const current = (s: QuizState) => (showingAnswer(s) ? s.answers.length - 1 : Math.min(s.answers.length, count(s) - 1))
const correctAt = (s: QuizState, i: number) => s.shown[i]!.indexOf(s.questions[i]!.answer)
const left = (s: QuizState) => Math.max(0, totalSteps(s) - s.steps)

export const quiz: GameRules<QuizState, QuizView> = {
  type: 'quiz',
  input: 'keys',
  start(mods, seed, theme = '') {
    const questions = questionsFor(THEMES[theme]?.quiz ?? { kind: 'bank', subjects: ['general'] }, seed, THEMES[theme]?.count ?? 5)
    const rng = createRng(seed ^ 0x9e3779b9) // a stream apart from the one that drew the questions
    const shown = questions.map((q) => {
      const all = [0, 1, 2, 3]
      if (!mods.eliminate) return all
      const drop = rng.pick(all.filter((i) => i !== q.answer))
      return all.filter((i) => i !== drop)
    })
    return { mods, questions, shown, answers: [], steps: 0, pause: 0 }
  },
  step(state, inputs) {
    if (isDone(state)) return state
    let { answers, pause } = state
    if (pause === 0) {
      const options = state.shown[answers.length]!.length
      const pick = inputs.find((i) => i.kind === 'choose' && i.option >= 0 && i.option < options)
      if (pick?.kind === 'choose') {
        answers = [...answers, pick.option]
        pause = PAUSE + 1 // the decrement below happens in this same step
      }
    }
    return { ...state, answers, pause: Math.max(0, pause - 1), steps: state.steps + 1 }
  },
  view(s) {
    const i = current(s)
    const q = s.questions[i]!
    return {
      index: i,
      total: count(s),
      prompt: q.prompt,
      choices: s.shown[i]!.map((c) => q.choices[c]!),
      picked: showingAnswer(s) ? s.answers[i]! : null,
      correct: correctAt(s, i),
      timeLeft: left(s) * STEP,
      timeTotal: totalSteps(s) * STEP,
      done: isDone(s),
    }
  },
  done: isDone,
  score(s) {
    const correct = s.answers.filter((a, i) => a === correctAt(s, i)).length
    return (0.9 * correct) / count(s) + (correct > 0 ? (0.1 * left(s)) / totalSteps(s) : 0)
  },
}
