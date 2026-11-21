import type { ReactNode } from 'react'
import type { ActivityDef } from '../../content/types'
import { gameScenePath } from '../../styles/art'
import type { TimingView as Model } from './rules'

const pct = (x: number) => `${x * 100}%`
const band = ([lo, hi]: [number, number]) => ({ left: pct(lo), right: pct(1 - hi) })

interface Props {
  view: Model
  def: ActivityDef
  /** Effects on the scene, such as 'flash zoom'. */
  effects?: string
  /** Drawn over the scene: the ball and the result word. */
  children?: ReactNode
}

/** The category's scene (or a plain panel), and the bar with its zone, gold core and marker. */
export function TimingView({ view, def, effects, children }: Props) {
  const flat = gameScenePath(def.category, 'flat')
  const pixel = gameScenePath(def.category, 'pixel')
  return (
    <>
      <div className={['pitch', !flat && !pixel && 'plain', effects].filter(Boolean).join(' ')}>
        {flat && <img className="fl" src={flat} alt="" />}
        {pixel && <img className="px" src={pixel} alt="" />}
        {children}
      </div>
      <div className="meter" aria-hidden="true">
        <div className="zone" style={band(view.zone)} />
        <div className="core" style={band(view.core)} />
        <div className="marker" data-testid="marker" style={{ left: pct(view.marker) }} />
      </div>
    </>
  )
}
