import { expect, it } from 'vitest'
import { play } from './sound'

it('stays silent without complaint when there is no audio', () => {
  expect(() => (['tap', 'open', 'ok', 'good', 'bad', 'age'] as const).forEach(play)).not.toThrow()
})
