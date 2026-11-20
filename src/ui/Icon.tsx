import type { CSSProperties } from 'react'
import { ICON_COLUMNS, iconIndex } from '../styles/art'

/** One tile of the skin's icon sheet; the sheet itself comes from the skin's stylesheet. */
export function Icon({ id, fallback, small }: { id: string; fallback: string; small?: boolean }) {
  const i = iconIndex(id, fallback)
  const style = { '--c': i % ICON_COLUMNS, '--r': Math.floor(i / ICON_COLUMNS) } as CSSProperties
  return <span className={small ? 'ico s' : 'ico'} style={style} aria-hidden="true" />
}
