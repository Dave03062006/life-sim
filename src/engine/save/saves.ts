import { NAMES } from '../../content/countries/indonesia/names'
import { startingPeople } from '../../life/people'
import type { Life } from '../../life/types'
import { createRng } from '../random'
import { checksumOf } from './checksum'
import type { KeyValueStore } from './storage'

export const SAVE_VERSION = 2
export interface SaveFile { version: 2; active: Life | null; past: Life[] }
export const EMPTY_SAVE: SaveFile = { version: 2, active: null, past: [] }
export interface Saves { load(): Promise<SaveFile>; store(file: SaveFile): Promise<void> }

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

const isLife = (v: unknown) => isObject(v) && (v.version === 1 || v.version === 2)

function isValid(raw: unknown): raw is { checksum: string; file: Record<string, unknown> } {
  if (!isObject(raw) || typeof raw.checksum !== 'string' || !isObject(raw.file)) return false
  const file = raw.file
  if (raw.checksum !== checksumOf(file)) return false
  if (typeof file.version !== 'number' || file.version > SAVE_VERSION) return false
  return (file.active === null || isLife(file.active)) && (file.past === undefined || (Array.isArray(file.past) && file.past.every(isLife)))
}

/** Version 1 lives gain a family (from their own generator) and the empty Plan 3 fields. */
function upgradeLife(old: Life | Record<string, unknown>): Life {
  if (old.version === 2) return old as Life
  const life = old as unknown as Life
  const rng = createRng(life.rng)
  const people = startingPeople(rng, life.age, life.gender, life.name, NAMES)
  return { ...life, version: 2, rng: rng.state, people, memories: [], interest: null, pendingEvents: [], seenEvents: [], spentWith: [] }
}

function upgrade(file: Record<string, unknown>): SaveFile {
  const past = (file.past ?? []) as Life[]
  return { version: 2, active: file.active ? upgradeLife(file.active as Life) : null, past: past.map(upgradeLife) }
}

export function createSaves(store: KeyValueStore): Saves {
  return {
    async load() {
      try {
        const raw = await store.get<unknown>('save')
        if (raw === undefined) return EMPTY_SAVE
        if (isValid(raw)) return raw.file.version === 2 ? (raw.file as unknown as SaveFile) : upgrade(raw.file)
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
