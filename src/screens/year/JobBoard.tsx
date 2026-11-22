import { useEffect, useRef, useState } from 'react'
import { play } from '../../app/sound'
import { useApp } from '../../app/store'
import { packFor } from '../../content'
import { jobBoard } from '../../life/work'
import type { Life } from '../../life/types'
import { ConfirmDialog } from '../ConfirmDialog'

/** Every career's entry job: open ones first, closed ones with their reason. Taking one over a job you hold asks first. */
export function JobBoard({ life }: { life: Life }) {
  const { takePath, setJobBoardOpen } = useApp()
  const [asking, setAsking] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const close = () => setJobBoardOpen(false)
  const latest = useRef(close)
  useEffect(() => {
    latest.current = close
  })
  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && latest.current()
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [asking])

  const pack = packFor(life.country)
  const rows = jobBoard(life, pack).sort((a, b) => Number(a.blocked !== null) - Number(b.blocked !== null))
  const titleOf = (id: string) => pack.careers.find((c) => `job:${c.id}` === id)?.steps[0]?.title ?? ''
  const take = (id: string) => {
    takePath(id)
    close()
  }
  if (asking) {
    return (
      <ConfirmDialog title={`Take the job as ${titleOf(asking)}?`} yes="Take the job" no="Keep my job" onAnswer={(yes) => (yes ? take(asking) : setAsking(null))}>
        You will leave your current job.
      </ConfirmDialog>
    )
  }
  return (
    <div className="scrim">
      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a modal <dialog> needs showModal(), which jsdom lacks */}
      <div ref={ref} className="card dialog jobs" role="dialog" aria-modal="true" aria-labelledby="jobs-title" tabIndex={-1}>
        <header className="sh">
          <h2 id="jobs-title">Job board</h2>
          <button className="ghost" onClick={close}>
            Close<kbd>Esc</kbd>
          </button>
        </header>
        <div className="opts">
          {rows.map((m) => (
            <button
              key={m.id}
              className="opt"
              disabled={m.blocked !== null}
              onClick={() => {
                play('tap')
                if (life.job) setAsking(m.id)
                else take(m.id)
              }}
            >
              {m.label}
              <small>{m.detail}</small>
              {m.blocked && <small className="why">{m.blocked}</small>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
