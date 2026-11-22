import { useMemo, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useApp } from '../app/store'
import { cleanName, MAX_NAME, WEALTH_LABEL } from '../life/roll'
import type { Gender, StatKey } from '../life/types'
import { newLife } from '../life/year'
import { StatBar } from '../ui/StatBar'
import { ConfirmDialog } from './ConfirmDialog'
import { TopBar } from './TopBar'
import { relationLabel } from './year/labels'

const GENDERS: [Gender, string][] = [
  ['female', 'Female'],
  ['male', 'Male'],
]
const STATS: StatKey[] = ['health', 'happiness', 'smarts', 'looks', 'stress', 'reputation']

/** Who you will be born as: edit the name and gender, re-roll the rest, then start at age 0. */
export function NewLife() {
  const roll = useApp((s) => s.roll)
  const life = useApp((s) => s.life)
  const confirming = useApp((s) => s.confirmAbandon)
  const settings = useApp((s) => s.settingsOpen)
  const { newRoll, editRoll, startLife, answerAbandon, goTitle } = useApp.getState()
  const start = useRef<HTMLButtonElement>(null)
  // built as Start builds it, so the preview is the life you get
  const preview = useMemo(() => roll && newLife({ ...roll, name: cleanName(roll.name), startAge: 0 }), [roll])
  if (!roll || !preview) return null
  const empty = !cleanName(roll.name)
  const answer = (yes: boolean) => {
    flushSync(() => answerAbandon(yes)) // drop inert before moving focus back
    if (!yes) start.current?.focus()
  }
  return (
    <>
      <TopBar />
      <main className="card screen roll" inert={confirming || settings}>
        <h1>A new life</h1>
        <div className="fields">
          <label className="field">
            <span className="label">Country</span>
            {/* shortcut: one country so far; list the content packs here when a second arrives */}
            <select value="indonesia" onChange={() => {}}>
              <option value="indonesia">Indonesia</option>
            </select>
          </label>
          <label className="field">
            <span className="label">Name</span>
            <input value={roll.name} maxLength={MAX_NAME} onChange={(e) => editRoll({ name: e.target.value })} />
          </label>
          <div className="field">
            <span className="label" id="gender-label">
              Gender
            </span>
            {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a fieldset would bring its own border and padding */}
            <div className="seg" role="group" aria-labelledby="gender-label">
              {GENDERS.map(([g, label]) => (
                <button key={g} aria-pressed={roll.gender === g} onClick={() => editRoll({ gender: g })}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <dl className="facts">
          <div>
            <dt className="label">City</dt>
            <dd>{roll.city}</dd>
          </div>
          <div>
            <dt className="label">Family wealth</dt>
            <dd>{WEALTH_LABEL[roll.wealth]}</dd>
          </div>
        </dl>
        <div className="family">
          <span className="label">Family</span>
          <ul>
            {preview.people.map((p) => (
              <li key={p.id}>
                {p.name}, {relationLabel(p).toLowerCase()}
              </li>
            ))}
          </ul>
        </div>
        <div className="stats">
          {STATS.map((stat) => (
            <StatBar key={stat} stat={stat} value={preview.stats[stat]} minor={stat === 'stress' || stat === 'reputation'} />
          ))}
        </div>
        <div className="row">
          {empty && (
            <p className="why" id="start-why">
              Your name can&apos;t be empty.
            </p>
          )}
          <button className="ghost" onClick={goTitle}>
            Back
          </button>
          <button className="ghost" onClick={() => newRoll()}>
            Re-roll
          </button>
          <button ref={start} className="primary" disabled={empty} aria-describedby={empty ? 'start-why' : undefined} onClick={startLife}>
            Start
          </button>
        </div>
      </main>
      {confirming && life && (
        <ConfirmDialog title="Start a new life?" yes="Start new life" no="Keep playing" onAnswer={answer}>
          {life.name}, aged {life.age}, moves to Past lives as unfinished.
        </ConfirmDialog>
      )}
    </>
  )
}
