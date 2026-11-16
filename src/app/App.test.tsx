import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { App } from './App'
import { GAME_NAME } from './name'

it('shows the name of the game', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: GAME_NAME })).toBeTruthy()
})
