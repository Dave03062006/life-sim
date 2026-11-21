import { expect, it, vi } from 'vitest'
import { useApp } from './store'

vi.mock('../engine/save/storage', async (original) => ({
  ...(await original<typeof import('../engine/save/storage')>()),
  indexedDbStore: () => {
    throw new Error('storage is blocked')
  },
}))

it('still boots, on a memory store, when the browser storage cannot be opened', async () => {
  await useApp.getState().boot()
  expect(useApp.getState().ready).toBe(true)
  useApp.getState().startDemoLife(7)
  expect(useApp.getState().life!.age).toBe(15)
})
