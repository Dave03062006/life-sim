import type { CSSProperties } from 'react'
import { STAGES, stageOf } from '../../life/stages'
import type { Life } from '../../life/types'
import { STAGE_LABEL } from './labels'

const YEARS_AHEAD = 7

/** The stages lived so far, with a dot per memory; a life that has ended has no years ahead and no current stage. */
export function Lifeline({ life }: { life: Life }) {
  const now = life.death ? null : stageOf(life.age).id
  return (
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
      {!life.death && (
        <div className="ahead" style={{ '--g': YEARS_AHEAD } as CSSProperties}>
          <span aria-hidden="true">The years ahead</span>
        </div>
      )}
    </div>
  )
}
