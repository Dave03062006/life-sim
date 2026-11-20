import { type CSSProperties, Fragment, useEffect, useRef } from 'react'
import { STAGES, stageOf } from '../../life/stages'
import type { JournalEntry, Life } from '../../life/types'
import { Changes } from '../../ui/Changes'
import { STAGE_LABEL } from './labels'

const YEARS_AHEAD = 7

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
        <div className="life" aria-hidden="true">
          {STAGES.filter((s) => s.from <= life.age).map((s) => (
            <div key={s.id} className={s.id === now ? 'now' : undefined} style={{ '--g': Math.min(life.age, s.to) - s.from + 1 } as CSSProperties}>
              <span>{STAGE_LABEL[s.id]}</span>
            </div>
          ))}
          <div className="ahead" style={{ '--g': YEARS_AHEAD } as CSSProperties}>
            <span>The years ahead</span>
          </div>
        </div>
      </header>
      <div className="entries" ref={entries} aria-live="polite" style={cover ? { paddingBottom: cover + 12 } : undefined}>
        {byAge(life.journal, life.age).map(([age, list]) => (
          <Fragment key={age}>
            <h3 className="yr">Age {age}</h3>
            {list.map((e, i) => (
              <p key={i} className={['e', e.kind === 'activity' && 'did', age < life.age && 'old', e === newest && 'new'].filter(Boolean).join(' ')}>
                {e.text}
                <Changes changes={e.changes} />
              </p>
            ))}
            {age === life.age && !list.some((e) => e.kind === 'activity') && <p className="e">The year is yours. Pick something to do below.</p>}
          </Fragment>
        ))}
      </div>
    </article>
  )
}
