import { useEffect, useRef } from 'react'
import { GAME_NAME } from '../app/name'
import { useApp } from '../app/store'
import { TopBar } from './TopBar'

/** Where every visit starts: carry on with the active life, or roll a new one. */
export function Title() {
  const life = useApp((s) => s.life)
  const settings = useApp((s) => s.settingsOpen)
  const { continueLife, newRoll } = useApp.getState()
  const first = useRef<HTMLButtonElement>(null)
  useEffect(() => first.current?.focus(), [])
  return (
    <>
      <TopBar />
      <main className="card screen title" inert={settings}>
        <h1>{GAME_NAME}</h1>
        {life && (
          <p className="note">
            {life.name}, aged {life.age}
          </p>
        )}
        <div className="row">
          {life && (
            <button ref={first} className="primary" onClick={continueLife}>
              Continue
            </button>
          )}
          <button ref={life ? undefined : first} className={life ? 'ghost' : 'primary'} onClick={() => newRoll()}>
            Start a life
          </button>
        </div>
      </main>
    </>
  )
}
