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

it('badges a known illness, tints the picture while untreated, and ignores a hidden one', () => {
  const ill = (known: boolean, treated: 'controlled' | null = null) => testLife({ illnesses: [{ id: 'dengue', since: 16, stage: 0, known, treated }] })
  const { container, rerender } = render(<Rail life={ill(true)} />)
  expect(screen.getByText('Dengue fever')).toBeTruthy()
  expect(container.querySelector('.scene.ill')).not.toBeNull()
  rerender(<Rail life={ill(true, 'controlled')} />)
  expect(screen.getByText('Dengue fever · controlled')).toBeTruthy()
  expect(container.querySelector('.scene.ill')).toBeNull()
  rerender(<Rail life={ill(false)} />)
  expect(screen.queryByText(/Dengue/)).toBeNull()
})
