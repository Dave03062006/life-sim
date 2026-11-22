import { NAMES } from '../../content/countries/indonesia/names'
import { startingPeople } from '../../life/people'
import { schoolForAge } from '../../life/requirements'
import type { Gender, Life, Person } from '../../life/types'
import { createRng } from '../random'
import { checksumOf } from './checksum'
import type { KeyValueStore } from './storage'

export const SAVE_VERSION = 4
export interface SaveFile { version: 4; active: Life | null; past: Life[] }
export const EMPTY_SAVE: SaveFile = { version: 4, active: null, past: [] }
export interface Saves { load(): Promise<SaveFile>; store(file: SaveFile): Promise<void> }

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

const isLife = (v: unknown) => isObject(v) && (v.version === 1 || v.version === 2 || v.version === 3 || v.version === 4)

function isValid(raw: unknown): raw is { checksum: string; file: Record<string, unknown> } {
  if (!isObject(raw) || typeof raw.checksum !== 'string' || !isObject(raw.file)) return false
  const file = raw.file
  if (raw.checksum !== checksumOf(file)) return false
  if (typeof file.version !== 'number' || file.version > SAVE_VERSION) return false
  return (file.active === null || isLife(file.active)) && (file.past === undefined || (Array.isArray(file.past) && file.past.every(isLife)))
}

/** Version 1 lives gain a family (from their own generator) and the empty Plan 3 fields; version 2 lives gain wealth and no death. */
function upgradeLife(old: Record<string, unknown>): Life {
  if (old.version === 4) return old as unknown as Life
  let life = old
  if (life.version === 1) {
    const rng = createRng(life.rng as number)
    const people = startingPeople(rng, life.age as number, life.gender as Gender, life.name as string, NAMES)
    life = { ...life, version: 2, rng: rng.state, people, memories: [], interest: null, pendingEvents: [], seenEvents: [], spentWith: [] }
  }
  if (life.version === 2) life = { ...life, version: 3, wealth: 'getting-by', death: null }
  const age = life.age as number
  const people = (life.people as Person[]).map((p) => (p.relation === 'partner' ? { ...p, since: age } : p))
  return { ...life, version: 4, people, school: schoolForAge(age), job: null, lifestyle: 'normal', ownWay: age >= 25, flags: [], belongings: [] } as unknown as Life
}

function upgrade(file: Record<string, unknown>): SaveFile {
  const past = (file.past ?? []) as Record<string, unknown>[]
  return { version: 4, active: file.active ? upgradeLife(file.active as Record<string, unknown>) : null, past: past.map(upgradeLife) }
}

/** Checks the checksum and version, then upgrades; null when the data is not a usable save. */
export function parseSave(raw: unknown): SaveFile | null {
  return isValid(raw) ? upgrade(raw.file) : null
}

export function createSaves(store: KeyValueStore): Saves {
  return {
    async load() {
      try {
        const raw = await store.get<unknown>('save')
        if (raw === undefined) return EMPTY_SAVE
        const parsed = parseSave(raw) // always upgrades: a version 3 file may still hold older lives
        if (parsed) return parsed
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
