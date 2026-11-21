import type { ReactNode } from 'react'
import type { GameInput } from '../framework'
import type { QuizView as Model } from './rules'

interface Props {
  view: Model
  send(input: GameInput): void
  children?: ReactNode
}

/** The question, numbered answer buttons, the right answer marked after a pick, and a time bar. */
export function QuizView({ view, send, children }: Props) {
  const mark = (i: number) => (view.picked === null ? '' : i === view.correct ? ' right' : i === view.picked ? ' wrong' : '')
  return (
    <div className="quizgame">
      <p className="quizcount">Question {view.index + 1} of {view.total}</p>
      <p className="quizprompt">{view.prompt}</p>
      <div className="choices">
        {view.choices.map((choice, i) => (
          // choices keep focus on the dialog, or the 1-4 keys would stop working
          <button key={choice} type="button" tabIndex={-1} className={`pad choice${mark(i)}`} onPointerDown={(e) => e.preventDefault()} onClick={() => send({ kind: 'choose', option: i })}>
            {choice}
            <kbd>{i + 1}</kbd>
          </button>
        ))}
      </div>
      <div className="timeleft" aria-hidden="true"><div style={{ width: `${(view.timeLeft / view.timeTotal) * 100}%` }} /></div>
      {children}
    </div>
  )
}
