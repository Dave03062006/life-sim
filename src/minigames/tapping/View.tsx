import type { ReactNode } from 'react'
import type { ActivityDef } from '../../content/types'
import { gameScenePath } from '../../styles/art'
import type { TappingView as Model } from './rules'

const pct = (x: number) => `${x * 100}%`

interface Props {
  view: Model
  def: ActivityDef
  /** Effects on the scene, such as 'flash zoom'. */
  effects?: string
  children?: ReactNode
}

/** The category's scene, a vertical meter with its band, and a time-left bar. */
export function TappingView({ view, def, effects, children }: Props) {
  const flat = gameScenePath(def.category, 'flat')
  const pixel = gameScenePath(def.category, 'pixel')
  return (
    <>
      <div className={['pitch', !flat && !pixel && 'plain', effects].filter(Boolean).join(' ')}>
        {flat && <img className="fl" src={flat} alt="" />}
        {pixel && <img className="px" src={pixel} alt="" />}
        {children}
      </div>
      <div className="tapgame" aria-hidden="true">
        <div className="vmeter">
          <div className="vband" style={{ bottom: pct(view.band[0]), top: pct(1 - view.band[1]) }} />
          <div className="vlevel" data-testid="level" style={{ height: pct(view.meter) }} />
        </div>
        <div className="timeleft"><div style={{ width: pct(Math.max(0, 1 - view.elapsed / view.total)) }} /></div>
      </div>
    </>
  )
}
