import { useEffect, useRef } from 'react'
import { useApp } from '../app/store'
import { TopBar } from './TopBar'

/** Every life lived here, newest first; each opens its summary. */
export function PastLives() {
  const past = useApp((s) => s.past)
  const settings = useApp((s) => s.settingsOpen)
  const { showSummary, goTitle } = useApp.getState()
  const back = useRef<HTMLButtonElement>(null)
  useEffect(() => back.current?.focus(), [])
  return (
    <>
      <TopBar />
      <main className="card screen past" inert={settings}>
        <h1>Past lives</h1>
        {past.length === 0 && <p className="note">No past lives yet.</p>}
        <ul className="lives">
          {past.toReversed().map((l) => (
            <li key={l.id}>
              <button onClick={() => showSummary(l.id)}>
                <b>{l.name}</b>
                <span>
                  {l.age} years · {l.death?.cause ?? 'Unfinished'}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="row">
          <button ref={back} className="ghost" onClick={goTitle}>
            Back
          </button>
        </div>
      </main>
    </>
  )
}
