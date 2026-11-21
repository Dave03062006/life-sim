import { expect, it } from 'vitest'
import { createSaves } from '../engine/save/saves'
import { memoryStore } from '../engine/save/storage'
import { useApp } from './store'

it('gives a new life at 15 its first year of events, shown one at a time', async () => {
  useApp.setState(useApp.getInitialState())
  await useApp.getState().boot(createSaves(memoryStore()))
  let seed = 0
  for (seed = 1; seed <= 200; seed++) {
    useApp.setState({ life: null, pendingEvent: null, askingInterest: false })
    useApp.getState().startDemoLife(seed)
    if (useApp.getState().life!.pendingEvents.some((p) => p.eventId === 'cover-for-friend')) break
  }
  expect(seed).toBeLessThanOrEqual(200)
  const { life, pendingEvent, askingInterest } = useApp.getState()
  expect(life!.seenEvents).toContain('cover-for-friend')
  expect(askingInterest || pendingEvent !== null).toBe(true) // the romance question may come before the first event
  expect(pendingEvent ?? life!.pendingEvents[0]).toEqual(life!.pendingEvents[0])
})
