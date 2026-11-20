import { useEffect, useRef } from 'react'
import { useSettings } from '../engine/settings'
import { useReducedMotion } from '../ui/useReducedMotion'

/** Settings that belong to this device, plus the medical note. */
export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { relaxed, update } = useSettings()
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="scrim">
      <div
        ref={ref}
        className="card dialog"
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a modal <dialog> needs showModal(), which jsdom lacks
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
      >
        <h2 id="settings-title">Settings</h2>
        <label>
          <input type="checkbox" checked={reduced} onChange={(e) => update({ reducedMotion: e.target.checked ? 'on' : 'system' })} /> Reduce motion
        </label>
        <label>
          <input type="checkbox" checked={relaxed} onChange={(e) => update({ relaxed: e.target.checked })} /> Relaxed mini-games
        </label>
        <p className="note">This is a game. Its health figures are simplified from the sources it lists, and it is not medical advice.</p>
        <button className="primary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
