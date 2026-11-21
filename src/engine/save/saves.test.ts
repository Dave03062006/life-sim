import { describe, expect, it } from 'vitest'
import { testLife } from '../../life/testLife'
import { checksumOf } from './checksum'
import { createSaves, EMPTY_SAVE, type SaveFile } from './saves'
import { memoryStore } from './storage'

describe('saves', () => {
  it('stores and reads a save', async () => {
    const saves = createSaves(memoryStore())
    expect(await saves.load()).toEqual(EMPTY_SAVE)
    const file: SaveFile = { version: 2, active: testLife(), past: [] }
    await saves.store(file)
    expect(await saves.load()).toEqual(file)
  })
  it('upgrades a version 1 save instead of starting fresh', async () => {
    const { people: _p, memories: _m, interest: _i, pendingEvents: _e, seenEvents: _s, spentWith: _w, ...rest } = testLife({ age: 15, journal: [{ age: 15, kind: 'milestone', text: 'x', changes: [] }] })
    const old = { ...rest, version: 1 }
    const store = memoryStore()
    await store.set('save', { checksum: checksumOf({ version: 1, active: old, past: [old] }), file: { version: 1, active: old, past: [old] } })
    const loaded = await createSaves(store).load()
    expect(loaded.version).toBe(2)
    for (const life of [loaded.active!, loaded.past[0]!]) {
      expect(life.version).toBe(2)
      expect(life.stats).toEqual(old.stats)
      expect(life.journal).toEqual(old.journal)
      expect(life.people.map((p) => p.relation)).toEqual(expect.arrayContaining(['mother', 'father', 'friend']))
      expect(life.memories).toEqual([])
    }
    expect(loaded.active!.rng).not.toBe(old.rng)
    expect(await store.get('save-damaged')).toBeUndefined()
  })
  it('starts fresh and keeps the bad data aside when a save is damaged or from a newer version', async () => {
    const bads = [{ checksum: 'wrong', file: { version: 2, active: testLife(), past: [] } }, 'not a save', { checksum: checksumOf({ version: 99 }), file: { version: 99 } }]
    for (const bad of bads) {
      const store = memoryStore()
      await store.set('save', bad)
      expect(await createSaves(store).load()).toEqual(EMPTY_SAVE)
      expect(await store.get('save-damaged')).toEqual(bad)
    }
  })
})
