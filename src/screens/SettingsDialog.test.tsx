import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { packFor } from '../content'
import { SettingsDialog } from './SettingsDialog'

it('lists each condition with at least one source link opening in a new tab', () => {
  render(<SettingsDialog onClose={() => {}} />)
  for (const def of packFor('indonesia').illnesses) {
    const links = within(screen.getByText(def.name, { selector: 'li > b' }).parentElement!).getAllByRole('link', { hidden: true })
    expect(links.length).toBeGreaterThan(0)
    expect(links[0]!.getAttribute('rel')).toBe('noreferrer')
    expect(links[0]!.getAttribute('target')).toBe('_blank')
  }
})
