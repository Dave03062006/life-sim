import { type ReactNode, useEffect, useRef } from 'react'

/** A yes-or-no question. Focus starts on the safe answer, and Escape gives it. */
export function ConfirmDialog({ title, yes, no, onAnswer, children }: { title: string; yes: string; no: string; onAnswer: (yes: boolean) => void; children: ReactNode }) {
  const safe = useRef<HTMLButtonElement>(null)
  const latest = useRef(onAnswer)
  useEffect(() => {
    latest.current = onAnswer
  })
  useEffect(() => {
    safe.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && latest.current(false)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])
  return (
    <div className="scrim">
      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a modal <dialog> needs showModal(), which jsdom lacks */}
      <div className="card dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-text">
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-text">{children}</p>
        <div className="row">
          <button className="ghost" onClick={() => onAnswer(true)}>
            {yes}
          </button>
          <button ref={safe} className="primary" onClick={() => onAnswer(false)}>
            {no}
          </button>
        </div>
      </div>
    </div>
  )
}
