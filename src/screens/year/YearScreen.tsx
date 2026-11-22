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
import { EventDialog } from './EventDialog'
import { InterestDialog } from './InterestDialog'
import { JobBoard } from './JobBoard'
import { Journal } from './Journal'
import { Rail } from './Rail'
import { Result } from './Result'

/** One year of a life: the character, the journal, and what you can do. */
export function YearScreen({ life }: { life: Life }) {
  const { openCategory, playing, lastResult, birthday, settingsOpen, pendingEvent, lastEvent, askingInterest, jobBoardOpen, open, begin, closeResult, ageUp, endBirthday } = useApp()
  const asking = pendingEvent !== null || lastEvent !== null || askingInterest
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
  // Once the job board closes, focus goes back to its button.
  const wasBoard = useRef(false)
  useEffect(() => {
    if (jobBoardOpen || !wasBoard.current) {
      wasBoard.current = jobBoardOpen
      return
    }
    wasBoard.current = false
    ;(document.querySelector<HTMLButtonElement>('.sheet .job-board-btn') ?? document.querySelector<HTMLButtonElement>('.dock .age'))?.focus()
  }, [jobBoardOpen])
  // Once the last event or question closes, focus goes to the age button.
  const wasAsking = useRef(false)
  useEffect(() => {
    if (asking || !wasAsking.current) {
      wasAsking.current = asking
      return
    }
    wasAsking.current = false
    if (!useApp.getState().playing) document.querySelector<HTMLButtonElement>('.dock .age')?.focus() // a mini-game takes focus itself
  }, [asking])
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
      <div className="app" inert={Boolean(playing || lastResult || birthday !== null || settingsOpen || asking || jobBoardOpen)}>
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
      {(pendingEvent || lastEvent) && <EventDialog life={life} />}
      {askingInterest && <InterestDialog />}
      {jobBoardOpen && <JobBoard life={life} />}
      {birthday !== null && <Birthday age={birthday} onDone={endBirthday} />}
    </>
  )
}
