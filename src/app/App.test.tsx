import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { App } from './App'
import { GAME_NAME } from './name'

it('shows the name of the game once the save has loaded', async () => {
  render(<App />)
  expect(await screen.findByRole('heading', { name: GAME_NAME })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Start a life' })).toBeTruthy()
})
