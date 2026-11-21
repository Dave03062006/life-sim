import type { ReactNode } from 'react'
import type { ActivityDef } from '../../content/types'
import type { GameInput } from '../framework'
import { THEMES } from '../themes'
import type { MemoryView as Model } from './rules'

interface Props {
  view: Model
  def: ActivityDef
  send(input: GameInput): void
  children?: ReactNode
}

/** Four pads in a 2x2 grid; they light while watching and take clicks while repeating. */
export function MemoryView({ view, def, send, children }: Props) {
  const labels = THEMES[def.minigame?.theme ?? '']?.pads ?? ['1', '2', '3', '4']
  return (
    <div className="memgame">
      <div className="pads">
        {labels.map((label, i) => (
          // pads keep focus on the dialog, or the 1-4 keys would stop working
          <button key={label} type="button" tabIndex={-1} className={view.lit === i ? 'pad lit' : 'pad'} onPointerDown={(e) => e.preventDefault()} onClick={() => send({ kind: 'choose', option: i })}>
            {label}
            <kbd>{i + 1}</kbd>
          </button>
        ))}
      </div>
      <p className="memstatus">
        {view.phase === 'watch' ? 'Watch…' : 'Your turn'}{' '}
        <span aria-hidden="true">{Array.from({ length: view.length }, (_, i) => (i < view.entered.length ? '●' : '○')).join(' ')}</span>
      </p>
      {children}
    </div>
  )
}
