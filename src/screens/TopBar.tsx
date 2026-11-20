import { useRef, useState } from 'react'
import { GAME_NAME } from '../app/name'
import { play } from '../app/sound'
import { useSettings } from '../engine/settings'
import type { Skin } from '../styles/art'
import { SettingsDialog } from './SettingsDialog'

const SKINS: [Skin, string][] = [
  ['flat', 'Flat illustrated'],
  ['pixel', 'Pixel'],
]

export function TopBar() {
  const { style, sound, update } = useSettings()
  const [settings, setSettings] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)
  const close = () => {
    setSettings(false)
    opener.current?.focus()
  }
  return (
    <header className="top">
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
        <button ref={opener} className="ghost" onClick={() => setSettings(true)}>
          Settings
        </button>
      </div>
      {settings && <SettingsDialog onClose={close} />}
    </header>
  )
}
