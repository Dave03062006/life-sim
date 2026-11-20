import { formatRupiah } from '../life/format'
import { isBenefit, STAT_LABEL } from '../life/stats'
import type { Change } from '../life/types'

function changeText({ key, delta }: Change): string {
  if (key === 'money') return `${delta > 0 ? '+' : ''}${formatRupiah(delta)}`
  const label = key === 'energy' ? 'Energy' : STAT_LABEL[key]
  return `${label} ${delta > 0 ? '+' : '−'}${Math.abs(delta)}`
}

/** One chip per change, green when it helps and red when it hurts. */
export function Changes({ changes }: { changes: readonly Change[] }) {
  return changes.map((c) => (
    <span key={c.key} className={`chg ${isBenefit(c.key, c.delta) ? 'up' : 'down'}`}>
      {changeText(c)}
    </span>
  ))
}
