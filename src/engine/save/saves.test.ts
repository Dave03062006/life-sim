import { describe, expect, it } from 'vitest'
import { testLife } from '../../life/testLife'
import { checksumOf } from './checksum'
import { createSaves, EMPTY_SAVE, parseSave, type SaveFile } from './saves'
import { memoryStore } from './storage'

describe('saves', () => {
  it('stores and reads a save', async () => {
    const saves = createSaves(memoryStore())
    expect(await saves.load()).toEqual(EMPTY_SAVE)
    const file: SaveFile = { version: 4, active: testLife(), past: [] }
    await saves.store(file)
    expect(await saves.load()).toEqual(file)
  })
  it('upgrades a version 1 save instead of starting fresh', async () => {
    const { people: _p, memories: _m, interest: _i, pendingEvents: _e, seenEvents: _s, spentWith: _w, ...rest } = testLife({ age: 15, journal: [{ age: 15, kind: 'milestone', text: 'x', changes: [] }] })
    const old = { ...rest, version: 1 }
    const store = memoryStore()
    await store.set('save', { checksum: checksumOf({ version: 1, active: old, past: [old] }), file: { version: 1, active: old, past: [old] } })
    const loaded = await createSaves(store).load()
    expect(loaded.version).toBe(4)
    for (const life of [loaded.active!, loaded.past[0]!]) {
      expect(life.version).toBe(4)
      expect(life.wealth).toBe('getting-by')
      expect(life.death).toBeNull()
      expect(life.stats).toEqual(old.stats)
      expect(life.journal).toEqual(old.journal)
      expect(life.people.map((p) => p.relation)).toEqual(expect.arrayContaining(['mother', 'father', 'friend']))
      expect(life.memories).toEqual([])
    }
    expect(loaded.active!.rng).not.toBe(old.rng)
    expect(await store.get('save-damaged')).toBeUndefined()
  })
  it('upgrades a version 1 life inside a version 2 file', async () => {
    const { people: _p, memories: _m, interest: _i, pendingEvents: _e, seenEvents: _s, spentWith: _w, ...rest } = testLife({ age: 15 })
    const file = { version: 2, active: { ...rest, version: 1 }, past: [testLife({ id: 'old' })] }
    const store = memoryStore()
    await store.set('save', { checksum: checksumOf(file), file })
    const loaded = await createSaves(store).load()
    expect(loaded.active!.version).toBe(4)
    expect(loaded.active!.people.length).toBeGreaterThan(0)
    expect(loaded.active!.spentWith).toEqual([])
    expect(loaded.past).toEqual([testLife({ id: 'old' })])
  })
  it('upgrades a version 2 file', async () => {
    const { wealth: _w, death: _d, ...rest } = testLife({ id: 'old' })
    const file = { version: 2, active: { ...rest, version: 2 }, past: [] }
    const store = memoryStore()
    await store.set('save', { checksum: checksumOf(file), file })
    const loaded = await createSaves(store).load()
    expect(loaded).toEqual({ version: 4, active: testLife({ id: 'old' }), past: [] })
  })
  it('parseSave rejects a bad checksum, a non-object and a newer version', () => {
    const file = { version: 5, active: null, past: [] }
    expect(parseSave({ checksum: 'wrong', file: { version: 4, active: null, past: [] } })).toBeNull()
    expect(parseSave('nope')).toBeNull()
    expect(parseSave({ checksum: checksumOf(file), file })).toBeNull()
    const ok = { version: 4, active: null, past: [] }
    expect(parseSave({ checksum: checksumOf(ok), file: ok })).toEqual(ok)
  })
  it('starts fresh and keeps the bad data aside when a save is damaged or from a newer version', async () => {
    const bads = [{ checksum: 'wrong', file: { version: 4, active: testLife(), past: [] } }, 'not a save', { checksum: checksumOf({ version: 99 }), file: { version: 99 } }]
    for (const bad of bads) {
      const store = memoryStore()
      await store.set('save', bad)
      expect(await createSaves(store).load()).toEqual(EMPTY_SAVE)
      expect(await store.get('save-damaged')).toEqual(bad)
    }
  })
  describe('version 3 to 4', () => {
    const v3 = async (age: number, extra: object = {}) => {
      const { school: _s, job: _j, lifestyle: _l, ownWay: _o, flags: _f, belongings: _b, ...rest } = testLife({ age })
      const old = { ...rest, version: 3, ...extra }
      const file = { version: 3, active: old, past: [] }
      const store = memoryStore()
      await store.set('save', { checksum: checksumOf(file), file })
      return (await createSaves(store).load()).active!
    }
    it('fills the new fields', async () => {
      const life = await v3(30)
      expect(life).toMatchObject({ version: 4, job: null, lifestyle: 'normal', ownWay: true, flags: [], belongings: [] })
      expect(life.school).toMatchObject({ at: null, done: ['tk', 'sd', 'smp', 'sma'] })
    })
    it.each([
      [9, 'sd', 3, ['tk']],
      [16, 'sma', 1, ['tk', 'sd', 'smp']],
      [3, null, 0, []],
      [4, 'tk', 0, []],
      [13, 'smp', 1, ['tk', 'sd']],
    ])('age %i is at %s', async (age, at, year, done) => {
      expect((await v3(age)).school).toMatchObject({ at, year, done })
    })
    it('gives partners a since age', async () => {
      const people = [{ id: 'p', name: 'A', relation: 'partner', gender: 'female', age: 20, closeness: 50 }, { id: 'q', name: 'B', relation: 'friend', gender: 'male', age: 20, closeness: 50 }]
      const life = await v3(20, { people })
      expect(life.people[0]).toMatchObject({ relation: 'partner', since: 20 })
      expect(life.people[1]).not.toHaveProperty('since')
    })
  })
})
