import { useEffect, useRef } from 'react'
import { play } from '../../app/sound'
import { useApp } from '../../app/store'
import { INTEREST_LABEL } from './labels'

/** The romance question, asked once before the first romantic choice. */
export function InterestDialog() {
  const setInterest = useApp((s) => s.setInterest)
  const settingsOpen = useApp((s) => s.settingsOpen)
  const first = useRef<HTMLButtonElement>(null)
  useEffect(() => first.current?.focus(), [])
  return (
    <div className="veil" inert={settingsOpen}>
      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the mockup's veil and card, not the browser's dialog styling */}
      <div className="card modal ev" role="dialog" aria-modal="true" aria-labelledby="interest-title">
        <div className="evb">
          <h2 id="interest-title">Who are you interested in?</h2>
          <p>You can change this later in Settings.</p>
          <div className="opts">
            {INTEREST_LABEL.map(([id, label], i) => (
              <button key={id} className="opt" ref={i === 0 ? first : undefined} onClick={() => {
                  play('tap')
                  setInterest(id)
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
