import { useEffect } from 'react'
import { useSettings } from '../engine/settings'
import { YearScreen } from '../screens/year/YearScreen'
import { GAME_NAME } from './name'
import { useReducedMotion } from '../ui/useReducedMotion'
import { installKeys } from './keys'
import { applySkin } from './skin'
import { useApp } from './store'

export function App() {
  const ready = useApp((s) => s.ready)
  const life = useApp((s) => s.life)
  const startDemoLife = useApp((s) => s.startDemoLife)
  const style = useSettings((s) => s.style)

  useEffect(() => void useApp.getState().boot(), [])
  useEffect(() => applySkin(style), [style])
  useEffect(installKeys, [])
  const reduced = useReducedMotion()
  useEffect(() => {
    const root = document.documentElement
    if (reduced) root.dataset.motion = 'reduce'
    else delete root.dataset.motion
  }, [reduced])

  if (!ready) return null
  if (!life) {
    return (
      <main className="card start">
        <h1>{GAME_NAME}</h1>
        <button className="primary" onClick={() => startDemoLife()}>
          Start a life
        </button>
      </main>
    )
  }
  return <YearScreen life={life} />
}
