import { useEffect } from 'react'
import { useSettings } from '../engine/settings'
import { NewLife } from '../screens/NewLife'
import { PastLives } from '../screens/PastLives'
import { Summary } from '../screens/Summary'
import { Title } from '../screens/Title'
import { YearScreen } from '../screens/year/YearScreen'
import { useReducedMotion } from '../ui/useReducedMotion'
import { installKeys } from './keys'
import { applySkin } from './skin'
import { useApp } from './store'

export function App() {
  const ready = useApp((s) => s.ready)
  const life = useApp((s) => s.life)
  const screen = useApp((s) => s.screen)
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
  if (screen === 'year' && life) return <YearScreen life={life} />
  if (screen === 'new-life') return <NewLife />
  if (screen === 'summary') return <Summary />
  if (screen === 'past') return <PastLives />
  return <Title />
}
