import { play } from '../../app/sound'
import { useApp } from '../../app/store'
import { packFor } from '../../content'
import { pathActions } from '../../life/path'
import { schoolLabel } from '../../life/school'
import type { Life } from '../../life/types'
import { jobLabel } from '../../life/work'

/** Where you are (school or job) and the moves you can make; the closed ones sit folded away with their reasons. */
export function PathPanel({ life, onLayout }: { life: Life; onLayout(): void }) {
  const takePath = useApp((s) => s.takePath)
  const setJobBoardOpen = useApp((s) => s.setJobBoardOpen)
  const moves = pathActions(life, packFor(life.country))
  const open = moves.filter((m) => !m.blocked)
  const closed = moves.filter((m) => m.blocked)
  const status = schoolLabel(life) ?? jobLabel(life) ?? (life.age >= 15 ? 'No job yet' : null)
  return (
    <section className="people" aria-label="Your path">
      {status && <p className="status"><b>{status}</b></p>}
      <div className="opts">
        {open.map((m) => (
          <button
            key={m.id}
            className="opt"
            onClick={() => {
              play('tap')
              takePath(m.id)
            }}
          >
            {m.label}
            <small>{m.detail}</small>
          </button>
        ))}
        {life.age >= 15 && (
          <button
            className="opt job-board-btn"
            onClick={() => {
              play('open')
              setJobBoardOpen(true)
            }}
          >
            Job board
            <small>See what is hiring, and what it pays.</small>
          </button>
        )}
      </div>
      {closed.length > 0 && (
        <details onToggle={onLayout}>
          <summary>Not open yet ({closed.length})</summary>
          <div className="opts">
            {closed.map((m) => (
              <button key={m.id} className="opt" disabled>
                {m.label}
                <small className="why">{m.blocked}</small>
              </button>
            ))}
          </div>
        </details>
      )}
    </section>
  )
}
