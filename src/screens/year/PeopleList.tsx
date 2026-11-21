import { type CSSProperties, useLayoutEffect, useState } from 'react'
import { play } from '../../app/sound'
import { useApp } from '../../app/store'
import { actionsFor, type PersonActionId } from '../../life/personActions'
import type { JournalEntry, Life } from '../../life/types'
import { Changes, Closeness } from '../../ui/Changes'
import { relationLabel } from './labels'

/** Your people above the People activities; choosing one shows what you can do with them. */
export function PeopleList({ life, onLayout }: { life: Life; onLayout(): void }) {
  const personAction = useApp((s) => s.personAction)
  const [chosen, setChosen] = useState<string | null>(null)
  const [done, setDone] = useState<JournalEntry | null>(null) // a gift finishes at once, so it is confirmed here
  useLayoutEffect(() => onLayout(), [chosen, done, onLayout])

  const act = (id: string, action: PersonActionId) => {
    play('tap')
    const before = useApp.getState().life?.journal
    personAction(id, action)
    const after = useApp.getState().life?.journal
    setDone(action === 'gift' && after !== before ? (after?.at(-1) ?? null) : null)
  }
  return (
    <section className="people" aria-label="Your people">
      <div className="folks">
        {life.people.map((p) => (
          <div key={p.id} className="person">
            <button className="opt" aria-pressed={chosen === p.id} onClick={() => {
                play('tap')
                setChosen(chosen === p.id ? null : p.id)
                setDone(null)
              }}
            >
              {p.name}
              <small>
                {relationLabel(p)} · {p.age}
              </small>
            </button>
            {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a native <meter> cannot hold the skins' fill and segment marks */}
            <div className="bar" role="meter" aria-label={p.name} aria-valuetext={`Closeness ${p.closeness}`} aria-valuenow={p.closeness} aria-valuemin={0} aria-valuemax={100} style={{ '--c': 'var(--happy)', '--v': p.closeness } as CSSProperties}>
              <i />
            </div>
          </div>
        ))}
      </div>
      {chosen && (
        <div className="opts">
          {actionsFor(life, chosen).map((a) => (
            <button key={a.id} className="opt" disabled={a.blocked !== null} onClick={() => act(chosen, a.id)}>
              {a.label}
              <small className={a.blocked ? 'why' : undefined}>{a.blocked ?? a.detail}</small>
            </button>
          ))}
        </div>
      )}
      <output className="done">
        {done && (
          <>
            {done.text}
            <Changes changes={done.changes} />
            <Closeness moved={done.people} people={life.people} />
          </>
        )}
      </output>
    </section>
  )
}
