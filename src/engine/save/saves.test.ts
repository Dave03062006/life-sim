import { describe, expect, it } from 'vitest'
import { testLife } from '../../life/testLife'
import { createSaves, EMPTY_SAVE, type SaveFile } from './saves'
import { memoryStore } from './storage'

describe('saves', () => {
  it('stores and reads a save', async () => {
    const saves = createSaves(memoryStore())
    expect(await saves.load()).toEqual(EMPTY_SAVE)
    const file: SaveFile = { version: 1, active: testLife(), past: [] }
    await saves.store(file)
    expect(await saves.load()).toEqual(file)
  })
  it('starts fresh and keeps the bad data aside when a save is damaged or from a newer version', async () => {
    const bads = [{ checksum: 'wrong', file: { version: 1, active: testLife(), past: [] } }, 'not a save', { checksum: 'x', file: { version: 99 } }]
    for (const bad of bads) {
      const store = memoryStore()
      await store.set('save', bad)
      expect(await createSaves(store).load()).toEqual(EMPTY_SAVE)
      expect(await store.get('save-damaged')).toEqual(bad)
    }
  })
})
