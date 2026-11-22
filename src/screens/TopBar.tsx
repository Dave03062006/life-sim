import { useRef } from 'react'
import { flushSync } from 'react-dom'
import { GAME_NAME } from '../app/name'
import { play } from '../app/sound'
import { useApp } from '../app/store'
import { useSettings } from '../engine/settings'
import type { Skin } from '../styles/art'
import { SettingsDialog } from './SettingsDialog'

const SKINS: [Skin, string][] = [
  ['flat', 'Flat illustrated'],
  ['pixel', 'Pixel'],
]

/** inert: a dialog the screen owns is open, so the bar (and Settings) must wait. */
export function TopBar({ inert = false }: { inert?: boolean }) {
  const { style, sound, update } = useSettings()
  const settings = useApp((s) => s.settingsOpen)
  const setSettings = useApp((s) => s.setSettingsOpen)
  const inYear = useApp((s) => s.screen === 'year')
  const confirming = useApp((s) => s.confirmAbandon)
  const goTitle = useApp((s) => s.goTitle)
  const opener = useRef<HTMLButtonElement>(null)
  const close = () => {
    flushSync(() => setSettings(false)) // drop inert before moving focus back
    // mid-game, focus goes to the game: a focused button would swallow Space and Enter
    const game = useApp.getState().playing && document.querySelector<HTMLElement>('.modal.game')
    ;(game || opener.current)?.focus()
  }
  return (
    <>
      <header className="top" inert={settings || confirming || inert}>
        <div className="brand">
          <i />
          {GAME_NAME} <em>working title</em>
        </div>
        <div className="hint" />
        <div className="tools">
          {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a fieldset would bring its own border and padding */}
          <div className="seg" role="group" aria-label="Art style">
            {SKINS.map(([skin, label]) => (
              <button
                key={skin}
                aria-pressed={style === skin}
                onClick={() => {
                  play('open')
                  update({ style: skin })
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button className="ghost snd" aria-pressed={!sound} onClick={() => update({ sound: !sound })}>
            {sound ? 'Sound on' : 'Sound off'}
          </button>
          {inYear && (
            <button className="ghost" onClick={goTitle}>
              Menu
            </button>
          )}
          <button ref={opener} className="ghost" onClick={() => setSettings(true)}>
            Settings
          </button>
        </div>
      </header>
      {settings && <SettingsDialog onClose={close} />}
    </>
  )
}
