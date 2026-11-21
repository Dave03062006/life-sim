import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { play } from '../../app/sound'
import { useApp } from '../../app/store'
import { stageOf } from '../../life/stages'
import type { CategoryId, Life } from '../../life/types'
import { MinigameHost } from '../../minigames/Host'
import { ambientPath } from '../../styles/art'
import { TopBar } from '../TopBar'
import { ActivitySheet } from './ActivitySheet'
import { Birthday } from './Birthday'
import { Dock } from './Dock'
import { Journal } from './Journal'
import { Rail } from './Rail'
import { Result } from './Result'

/** One year of a life: the character, the journal, and what you can do. */
export function YearScreen({ life }: { life: Life }) {
  const { openCategory, playing, lastResult, birthday, settingsOpen, open, begin, closeResult, ageUp, endBirthday } = useApp()
  const [cover, setCover] = useState(0)
  const started = useRef<string | null>(null)
  const hadResult = useRef(false)
  const onBegin = (id: string) => {
    started.current = id
    begin(id)
  }
  // Once a result closes, focus goes back to where the player was.
  useEffect(() => {
    if (lastResult) hadResult.current = true
    if (lastResult || !hadResult.current) return
    hadResult.current = false
    const card = (sel: string) => document.querySelector<HTMLButtonElement>(`.sheet .act${sel}:not(:disabled)`)
    ;(card(`[data-id="${started.current}"]`) ?? card('') ?? document.querySelector<HTMLButtonElement>('.dock .age'))?.focus()
  }, [lastResult])
  const stage = stageOf(life.age)
  const toggle = (id: CategoryId) => {
    if (openCategory !== id) play('open')
    open(openCategory === id ? null : id)
  }
  const onAgeUp = () => {
    play('age')
    ageUp()
  }

  const amb = {
    '--amb-flat': `url(${ambientPath(stage.id, life.gender, 'flat')})`,
    '--amb-pixel': `url(${ambientPath(stage.id, life.gender, 'pixel')})`,
  } as CSSProperties

  return (
    <>
      <div className="amb" style={amb} aria-hidden="true" />
      <TopBar />
      <div className="app" inert={Boolean(playing || lastResult || birthday !== null || settingsOpen)}>
        <Rail life={life} />
        <main className="main">
          <div className="stage">
            <Journal life={life} cover={openCategory ? cover : 0} />
            {openCategory && <ActivitySheet life={life} category={openCategory} onBegin={onBegin} onClose={() => open(null)} onHeight={setCover} />}
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
