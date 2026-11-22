import { useEffect, useRef, useState } from 'react'
import { downloadText, exportText, importText } from '../app/backup'
import { GAME_NAME } from '../app/name'
import { useApp } from '../app/store'
import type { SaveFile } from '../engine/save/saves'
import { ConfirmDialog } from './ConfirmDialog'
import { TopBar } from './TopBar'

/** Where every visit starts: carry on with the active life, or roll a new one. */
export function Title() {
  const life = useApp((s) => s.life)
  const pastCount = useApp((s) => s.past.length)
  const settings = useApp((s) => s.settingsOpen)
  const { continueLife, newRoll, showPast } = useApp.getState()
  const [incoming, setIncoming] = useState<SaveFile | null>(null)
  const [bad, setBad] = useState(false)
  const pick = useRef<HTMLInputElement>(null)
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
          {pastCount > 0 && (
            <button className="ghost" onClick={showPast}>
              Past lives ({pastCount})
            </button>
          )}
        </div>
        <div className="row">
          <button
            className="ghost"
            onClick={() => {
              const { life, past } = useApp.getState()
              downloadText('life-sim-saves.json', exportText({ version: 3, active: life, past }))
            }}
          >
            Export
          </button>
          <button className="ghost" onClick={() => pick.current?.click()}>
            Import
          </button>
          <input
            ref={pick}
            type="file"
            accept=".json,application/json"
            aria-label="Import file"
            tabIndex={-1}
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              let parsed = null
              try {
                parsed = importText(await file.text())
              } catch {
                // an unreadable file is reported like a bad one
              }
              setBad(!parsed)
              setIncoming(parsed)
            }}
          />
        </div>
        <p role="alert">{bad ? "That file isn't a life-sim save, or it's damaged." : ''}</p>
      </main>
      {incoming && (
        <ConfirmDialog
          title="Import saves"
          yes="Replace"
          no="Keep mine"
          onAnswer={(yes) => {
            if (yes) useApp.getState().replaceSaves(incoming)
            setIncoming(null)
          }}
        >
          Replace your current life and past lives with this file?
        </ConfirmDialog>
      )}
    </>
  )
}
