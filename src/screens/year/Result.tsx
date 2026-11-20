import { useEffect, useRef } from 'react'
import { RESULT_SOUND, play } from '../../app/sound'
import type { ActivityDef, ResultTier } from '../../content/types'
import type { JournalEntry } from '../../life/types'
import { Changes } from '../../ui/Changes'

/** What an activity with no mini-game did: its journal line and changes. */
export function Result({ def, tier, entry, onClose }: { def: ActivityDef; tier: ResultTier; entry: JournalEntry; onClose(): void }) {
  const back = useRef<HTMLButtonElement>(null)
  useEffect(() => back.current?.focus(), [])
  useEffect(() => play(RESULT_SOUND[tier]), [tier])
  return (
    <div className="veil">
      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the mockup's veil and card, not the browser's dialog styling */}
      <div className="card modal" role="dialog" aria-modal="true" aria-labelledby="result-title">
        <span className="label">Done</span>
        <h2 id="result-title">{def.title}</h2>
        <div className="mf">
          <div className="res">
            {entry.text}
            <Changes changes={entry.changes} />
          </div>
          <button className="primary" ref={back} onClick={onClose}>
            Back to your year
          </button>
        </div>
      </div>
    </div>
  )
}
