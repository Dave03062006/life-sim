import { stageOf } from '../life/stages'
import { play } from './sound'
import { useApp } from './store'

/** Adds the keyboard shortcuts; returns a function that removes them. */
export function installKeys(): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
    const el = e.target
    if (el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) && el.getAttribute('type') !== 'checkbox') return
    const { life, playing, lastResult, birthday, settingsOpen, openCategory, open, closeResult } = useApp.getState()
    if (!life || settingsOpen) return // the settings dialog handles its own keys
    if (lastResult) {
      if (e.key === 'Escape') closeResult()
      return
    }
    if (playing || birthday !== null) return
    if (e.key === 'Escape') return open(null)
    const id = /^[1-8]$/.test(e.key) ? stageOf(life.age).categories[Number(e.key) - 1] : undefined
    if (!id) return
    if (openCategory !== id) play('open')
    open(openCategory === id ? null : id)
  }
  addEventListener('keydown', onKey)
  return () => removeEventListener('keydown', onKey)
}
