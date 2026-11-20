import type { Life } from '../../life/types'
import { checksumOf } from './checksum'
import type { KeyValueStore } from './storage'

export const SAVE_VERSION = 1
export interface SaveFile { version: 1; active: Life | null; past: Life[] }
export const EMPTY_SAVE: SaveFile = { version: 1, active: null, past: [] }
export interface Saves { load(): Promise<SaveFile>; store(file: SaveFile): Promise<void> }

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

function isValid(raw: unknown): raw is { checksum: string; file: SaveFile } {
  if (!isObject(raw) || typeof raw.checksum !== 'string' || !isObject(raw.file)) return false
  const file = raw.file
  if (raw.checksum !== checksumOf(file)) return false
  if (typeof file.version !== 'number' || file.version > SAVE_VERSION) return false
  const active = file.active
  return active === null || (isObject(active) && active.version === 1)
}

export function createSaves(store: KeyValueStore): Saves {
  return {
    async load() {
      try {
        const raw = await store.get<unknown>('save')
        if (raw === undefined) return EMPTY_SAVE
        if (isValid(raw)) return raw.file
        await store.set('save-damaged', raw)
      } catch {
        // An unreadable store means starting fresh.
      }
      return EMPTY_SAVE
    },
    async store(file) {
      await store.set('save', { checksum: checksumOf(file), file })
    },
  }
}
