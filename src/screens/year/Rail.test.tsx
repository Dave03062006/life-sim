import { act, render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { useApp } from '../../app/store'
import { packFor } from '../../content'
import { testLife } from '../../life/testLife'
import { Rail } from './Rail'

it('floats the change beside each changed stat when a result applies', () => {
  useApp.setState(useApp.getInitialState())
  render(<Rail life={testLife()} />)
  const def = packFor('indonesia').activities[0]!
  const entry = { age: 16, kind: 'activity' as const, text: 'Done.', changes: [{ key: 'health' as const, delta: 3 }, { key: 'money' as const, delta: -30000 }] }
  act(() => useApp.setState({ lastResult: { def, tier: 'good', entry } }))
  const stats = within(screen.getByRole('region', { name: 'Stats' }))
  expect(stats.getByText('+3').className).toBe('delta up')
  expect(stats.getByText('−Rp 30.000').className).toBe('delta down')
})
