import { useEffect } from 'react'
import { useReducedMotion } from '../../ui/useReducedMotion'

export const BIRTHDAY_MS = 1250

/** The new age, full screen, for a moment. With reduced motion it is skipped. */
export function Birthday({ age, onDone }: { age: number; onDone(): void }) {
  const reduced = useReducedMotion()
  useEffect(() => {
    if (reduced) {
      onDone()
      return
    }
    const timer = setTimeout(onDone, BIRTHDAY_MS)
    return () => clearTimeout(timer)
  }, [reduced, onDone])
  if (reduced) return null
  return (
    <div className="turn">
      <div>
        <small>Happy birthday</small>
        <b>{age}</b>
      </div>
    </div>
  )
}
