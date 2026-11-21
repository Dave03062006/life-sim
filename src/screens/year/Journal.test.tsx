import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { testLife } from '../../life/testLife'
import { Journal } from './Journal'

it('shows a memory dot on the lifeline', () => {
  const text = 'You stood up for Dimas on the class trip.'
  render(<Journal life={testLife({ memories: [{ id: 'trip', age: 15, text, people: ['p-3'] }] })} cover={0} />)
  const dot = screen.getByRole('img', { name: text })
  expect(dot.getAttribute('title')).toBe(text)
  expect(dot.parentElement!.textContent).toBe('SMA') // 15 falls in the late-teen segment
  expect(dot.style.left).toBe('25%') // the first of the two years shown so far
})

it('labels events and memories, and shows closeness changes', () => {
  render(
    <Journal
      life={testLife({
        journal: [
          { age: 16, kind: 'memory', text: 'You remembered the class trip.', changes: [] },
          { age: 16, kind: 'event', text: 'You and Dimas talked it out.', changes: [{ key: 'happiness', delta: 2 }], people: [{ id: 'p-3', delta: 5 }, { id: 'p-9', delta: 4 }] },
          { age: 16, kind: 'activity', text: 'You gave Siti a gift.', changes: [], people: [{ id: 'p-1', delta: -3 }] },
        ],
      })}
      cover={0}
    />,
  )
  const memory = screen.getByText('You remembered the class trip.')
  expect(memory.className).toContain('mem')
  expect(memory.querySelector('.tagm')!.textContent).toBe('Remembered')
  const event = screen.getByText('You and Dimas talked it out.')
  expect(event.querySelector('.tagm')!.textContent).toBe('Event')
  expect(screen.getByText('Dimas +5').className).toBe('chg up')
  expect(screen.getByText('Siti −3').className).toBe('chg down')
  expect(screen.queryByText(/\+4/)).toBeNull() // p-9 is no longer in this life
})
