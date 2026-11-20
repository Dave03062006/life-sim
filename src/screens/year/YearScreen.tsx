import { type CSSProperties, useEffect, useState } from 'react'
import { play } from '../../app/sound'
import { useApp } from '../../app/store'
import { GAME_NAME } from '../../app/name'
import { useSettings } from '../../engine/settings'
import { stageOf } from '../../life/stages'
import type { CategoryId, Life } from '../../life/types'
import { MinigameHost } from '../../minigames/Host'
import { ambientPath, type Skin } from '../../styles/art'
import { ActivitySheet } from './ActivitySheet'
import { Birthday } from './Birthday'
import { Dock } from './Dock'
import { Journal } from './Journal'
import { Rail } from './Rail'
import { Result } from './Result'

const SKINS: [Skin, string][] = [
  ['flat', 'Flat illustrated'],
  ['pixel', 'Pixel'],
]

/** One year of a life: the character, the journal, and what you can do. */
export function YearScreen({ life }: { life: Life }) {
  const { openCategory, playing, lastResult, birthday, open, begin, closeResult, ageUp, endBirthday } = useApp()
  const { style, sound, update } = useSettings()
  const [cover, setCover] = useState(0)
  const stage = stageOf(life.age)
  const toggle = (id: CategoryId) => {
    if (openCategory !== id) play('open')
    open(openCategory === id ? null : id)
  }
  const onAgeUp = () => {
    play('age')
    ageUp()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (playing || birthday !== null) return
      if (lastResult) {
        if (e.key === 'Escape') closeResult()
        return
      }
      const id = stage.categories[Number(e.key) - 1]
      if (e.key === 'Escape') open(null)
      else if (/^[1-8]$/.test(e.key) && id) {
        if (openCategory !== id) play('open')
        open(openCategory === id ? null : id)
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [playing, birthday, lastResult, closeResult, stage, open, openCategory])

  const amb = {
    '--amb-flat': `url(${ambientPath(stage.id, life.gender, 'flat')})`,
    '--amb-pixel': `url(${ambientPath(stage.id, life.gender, 'pixel')})`,
  } as CSSProperties

  return (
    <>
      <div className="amb" style={amb} aria-hidden="true" />
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
          <button className="ghost" aria-pressed={!sound} onClick={() => update({ sound: !sound })}>
            {sound ? 'Sound on' : 'Sound off'}
          </button>
        </div>
      </header>
      <div className="app">
        <Rail life={life} />
        <main className="main">
          <div className="stage">
            <Journal life={life} cover={openCategory ? cover : 0} />
            {openCategory && <ActivitySheet life={life} category={openCategory} onBegin={begin} onClose={() => open(null)} onHeight={setCover} />}
          </div>
          <Dock life={life} open={openCategory} onToggle={toggle} onAgeUp={onAgeUp} />
        </main>
      </div>
      {lastResult && !playing && <Result def={lastResult.def} tier={lastResult.tier} entry={lastResult.entry} onClose={closeResult} />}
      <MinigameHost />
      {birthday !== null && <Birthday age={birthday} onDone={endBirthday} />}
    </>
  )
}
