import type { ReactNode } from 'react'
import type { ActivityDef } from '../../content/types'
import { gameScenePath } from '../../styles/art'
import { THEMES } from '../themes'
import type { CatchView as Model } from './rules'

const pct = (x: number) => `${x * 100}%`

interface Props {
  view: Model
  def: ActivityDef
  /** Effects on the scene, such as 'flash zoom'. */
  effects?: string
  children?: ReactNode
}

/** The category's scene with labelled items falling into a basket bar. */
export function CatchView({ view, def, effects, children }: Props) {
  const flat = gameScenePath(def.category, 'flat')
  const pixel = gameScenePath(def.category, 'pixel')
  const { good = 'Good', bad = 'Bad' } = THEMES[def.minigame?.theme ?? '']?.catchItems ?? {}
  return (
    <div className={['pitch', !flat && !pixel && 'plain', effects].filter(Boolean).join(' ')}>
      {flat && <img className="fl" src={flat} alt="" />}
      {pixel && <img className="px" src={pixel} alt="" />}
      <div className="catchplay" aria-hidden="true">
        {view.items.map((i) => (
          <span key={i.id} className={i.good ? 'citem good' : 'citem bad'} style={{ left: pct(i.x), top: pct(i.y) }}>
            {i.good ? good : bad}
          </span>
        ))}
        <div className="basket" data-testid="basket" style={{ left: pct(view.x - view.width / 2), width: pct(view.width) }} />
      </div>
      {children}
    </div>
  )
}
