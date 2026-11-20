import { expect, it } from 'vitest'
import { rulesFor } from './index'
import { timing } from './timing/rules'

it('plays a type that is not built yet as Timing', () => {
  expect(rulesFor('timing')).toBe(timing)
  expect(rulesFor('quiz')).toBe(timing)
})
