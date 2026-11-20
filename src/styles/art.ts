import type { CategoryId, Gender, StageId } from '../life/types'
import { STAGES } from '../life/stages'
import manifest from './art-manifest.json'

export type Skin = 'flat' | 'pixel'
export const ICON_COLUMNS = 8

type Pair = Record<string, Record<Skin, string>>
const index: Record<string, number> = manifest.icons.index

export function hasIcon(id: string): boolean {
  return id in index
}

/** The icon's index, else the fallback's, else the first icon. */
export function iconIndex(id: string, fallback: string): number {
  return index[id] ?? index[fallback] ?? 0
}

export function iconSheet(skin: Skin): string {
  return manifest.icons.sheet[skin]
}

/** Same gender at the same stage, then nearer stages first, then the same for the other gender. */
function nearest(table: Pair, stage: StageId, gender: Gender, skin: Skin): string {
  const at = STAGES.findIndex((s) => s.id === stage)
  const order = STAGES.map((s, i) => ({ id: s.id, d: Math.abs(i - at), i })).sort((a, b) => a.d - b.d || a.i - b.i)
  const other: Gender = gender === 'male' ? 'female' : 'male'
  for (const g of [gender, other]) {
    for (const s of order) {
      const hit = table[`${s.id}-${g}`]
      if (hit) return hit[skin]
    }
  }
  throw new Error(`No art for ${stage}-${gender}`)
}

export function scenePath(stage: StageId, gender: Gender, skin: Skin): string {
  return nearest(manifest.scenes, stage, gender, skin)
}

export function ambientPath(stage: StageId, gender: Gender, skin: Skin): string {
  return nearest(manifest.ambient, stage, gender, skin)
}

export function gameScenePath(category: CategoryId, skin: Skin): string | null {
  const games: Pair = manifest.games
  return games[category]?.[skin] ?? null
}
