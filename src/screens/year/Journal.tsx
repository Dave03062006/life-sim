import { type CSSProperties, Fragment, useEffect, useRef } from 'react'
import { STAGES, stageOf } from '../../life/stages'
import type { JournalEntry, Life } from '../../life/types'
import { Changes, Closeness } from '../../ui/Changes'
import { STAGE_LABEL } from './labels'

const YEARS_AHEAD = 7
const TAG: Partial<Record<JournalEntry['kind'], string>> = { event: 'Event', memory: 'Remembered' }

function byAge(journal: readonly JournalEntry[], age: number): [number, JournalEntry[]][] {
  const groups = new Map<number, JournalEntry[]>()
  for (const e of journal) groups.set(e.age, [...(groups.get(e.age) ?? []), e])
  if (!groups.has(age)) groups.set(age, [])
  return [...groups].sort(([a], [b]) => a - b)
}

/** The story so far, a heading per year, newest at the bottom. `cover` is how much of its foot the activity sheet hides. */
export function Journal({ life, cover }: { life: Life; cover: number }) {
  const entries = useRef<HTMLDivElement>(null)
  const now = stageOf(life.age).id
  const newest = life.journal.at(-1)

  useEffect(() => {
    const el = entries.current
    if (el) el.scrollTop = el.scrollHeight
  }, [life.journal.length, cover])

  return (
    <article className="card journal">
      <header className="jh">
        <div className="agebig">
          <span className="label">Age</span>
          <b>{life.age}</b>
        </div>
        <div className="life">
          {STAGES.filter((s) => s.from <= life.age).map((s) => {
            const years = Math.min(life.age, s.to) - s.from + 1
            return (
              <div key={s.id} className={s.id === now ? 'now' : undefined} style={{ '--g': years } as CSSProperties}>
                <span aria-hidden="true">{STAGE_LABEL[s.id]}</span>
                {life.memories
                  .filter((m) => m.age >= s.from && m.age <= s.to)
                  .map((m) => (
                    // at the middle of the memory's year along its stage's segment
                    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a dot drawn in CSS, not an image file
                    <i key={m.id} role="img" aria-label={m.text} title={m.text} style={{ left: `${((m.age - s.from + 0.5) / years) * 100}%` }} />
                  ))}
              </div>
            )
          })}
          <div className="ahead" style={{ '--g': YEARS_AHEAD } as CSSProperties}>
            <span aria-hidden="true">The years ahead</span>
          </div>
        </div>
      </header>
      <div className="entries" ref={entries} aria-live="polite" style={cover ? { paddingBottom: cover + 12 } : undefined}>
        {byAge(life.journal, life.age).map(([age, list]) => (
          <Fragment key={age}>
            <h3 className="yr">Age {age}</h3>
            {list.map((e, i) => (
              <p key={i} className={['e', e.kind === 'activity' && 'did', e.kind === 'memory' && 'mem', age < life.age && 'old', e === newest && 'new'].filter(Boolean).join(' ')}>
                {TAG[e.kind] && <span className="tagm">{TAG[e.kind]}</span>}
                {e.text}
                <Changes changes={e.changes} />
                <Closeness moved={e.people} people={life.people} />
              </p>
            ))}
            {age === life.age && !list.some((e) => e.kind === 'activity') && <p className="e">The year is yours. Pick something to do below.</p>}
          </Fragment>
        ))}
      </div>
    </article>
  )
}
