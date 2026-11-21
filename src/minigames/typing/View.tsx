import type { ReactNode } from 'react'
import type { TypingView as Model } from './rules'

/** The target with each typed character marked right or wrong (wrong ones struck through), a caret, and a time bar. */
export function TypingView({ view, children }: { view: Model; children?: ReactNode }) {
  return (
    <div className="typegame">
      <p className="typetarget" aria-label={view.target}>
        {[...view.target].map((ch, i) => {
          const state = i >= view.typed.length ? '' : view.typed[i] === ch ? ' right' : ' wrong'
          return (
            <span key={i} className={`tch${state}${i === view.typed.length && !view.done ? ' caret' : ''}`}>
              {ch}
            </span>
          )
        })}
      </p>
      <div className="timeleft" aria-hidden="true"><div style={{ width: `${(view.timeLeft / view.timeTotal) * 100}%` }} /></div>
      {children}
    </div>
  )
}
