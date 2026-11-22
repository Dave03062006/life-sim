import { useEffect, useRef } from 'react'
import { useApp } from '../app/store'
import { formatRupiah } from '../life/format'
import { summaryOf } from '../life/summary'
import type { StatKey } from '../life/types'
import { StatBar } from '../ui/StatBar'
import { TopBar } from './TopBar'
import { relationLabel } from './year/labels'
import { Lifeline } from './year/Lifeline'

const STATS: StatKey[] = ['health', 'happiness', 'smarts', 'looks', 'stress', 'reputation']

/** A past life looked back on: how long it lasted, what it held, and who it left behind. */
export function Summary() {
  const life = useApp((s) => s.past.find((l) => l.id === s.summaryId))
  const settings = useApp((s) => s.settingsOpen)
  const { newRoll, showPast } = useApp.getState()
  const first = useRef<HTMLButtonElement>(null)
  useEffect(() => first.current?.focus(), [])
  if (!life) return null
  const s = summaryOf(life)
  return (
    <>
      <TopBar />
      <main className="card screen summary" inert={settings}>
        <header>
          <h1>{s.name}</h1>
          <p className="note">{s.ended === 'died' ? `Lived ${s.age} years` : `${s.age} years so far`}</p>
          <p className="note">{s.cause ?? 'Unfinished'}</p>
        </header>
        <Lifeline life={life} />
        <div className="stats">
          {STATS.map((stat) => (
            <StatBar key={stat} stat={stat} value={s.stats[stat]} minor={stat === 'stress' || stat === 'reputation'} />
          ))}
        </div>
        <dl className="facts">
          <div>
            <dt className="label">Net worth</dt>
            <dd>{formatRupiah(s.netWorth)}</dd>
          </div>
        </dl>
        {s.leftBehind.length > 0 && (
          <div className="family">
            <span className="label" id="left-behind">
              Left behind
            </span>
            <ul aria-labelledby="left-behind">
              {s.leftBehind.map((p) => (
                <li key={p.id}>
                  {p.name}, {relationLabel(p).toLowerCase()}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="closing">{s.closing}</p>
        <div className="row">
          <button className="ghost" onClick={showPast}>
            Past lives
          </button>
          <button ref={first} className="primary" onClick={() => newRoll()}>
            New life
          </button>
        </div>
      </main>
    </>
  )
}
