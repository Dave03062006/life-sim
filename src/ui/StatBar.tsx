import type { CSSProperties, ReactNode } from 'react'
import { STAT_LABEL } from '../life/stats'
import type { StatKey } from '../life/types'

const COLOUR: Record<StatKey, string> = {
  health: 'var(--health)',
  happiness: 'var(--happy)',
  smarts: 'var(--smarts)',
  looks: 'var(--looks)',
  stress: 'var(--minor)',
  reputation: 'var(--minor)',
}

const isLow = (stat: StatKey, value: number) => (stat === 'stress' ? value >= 70 : stat !== 'reputation' && value < 35)

export function StatBar({ stat, value, minor, children }: { stat: StatKey; value: number; minor?: boolean; children?: ReactNode }) {
  const label = STAT_LABEL[stat]
  const style = { '--c': COLOUR[stat], '--v': value } as CSSProperties
  return (
    <div className={['stat', minor && 'minor', isLow(stat, value) && 'low'].filter(Boolean).join(' ')} style={style}>
      <span>{label}</span>
      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a native <meter> cannot hold the skins' fill and segment marks */}
      <div className="bar" role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <i />
      </div>
      <b>{value}</b>
      {children}
    </div>
  )
}
