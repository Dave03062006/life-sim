import { type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { play, type Sound } from '../../app/sound'
import { useApp } from '../../app/store'
import { packFor } from '../../content'
import type { EventDef } from '../../content/types'
import { availableActions, DEFAULT_MANNERS, type EventTier, fill } from '../../life/events'
import type { JournalEntry, Life, PendingEvent } from '../../life/types'
import { eventArt } from '../../styles/art'
import { Changes, Closeness } from '../../ui/Changes'

const SOUND: Record<EventTier, Sound> = { success: 'good', mixed: 'ok', fail: 'bad' }

/** The event waiting for an answer, or the result of the one just answered. */
export function EventDialog({ life }: { life: Life }) {
  const pending = useApp((s) => s.pendingEvent)
  const last = useApp((s) => s.lastEvent)
  const settingsOpen = useApp((s) => s.settingsOpen)
  // the result keeps the cast's names in its title after the event leaves the queue
  const [cast, setCast] = useState(pending?.cast ?? {})
  if (pending && pending.cast !== cast) setCast(pending.cast)
  const def = last?.def ?? (pending && packFor(life.country).events.find((e) => e.id === pending.eventId))
  if (!def) return null
  const art = eventArt(def.id)
  return (
    <div className="veil" inert={settingsOpen}>
      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the mockup's veil and card, not the browser's dialog styling */}
      <div className="card modal ev" role="dialog" aria-modal="true" aria-labelledby="event-title">
        {art && (
          <div className="banner">
            <img className="fl" src={art.flat} alt="" />
            <img className="px" src={art.pixel} alt="" />
          </div>
        )}
        {last ? <Outcome life={life} title={fill(def.title, life, cast)} tier={last.tier} entry={last.entry} /> : pending && <Choice life={life} def={def} pending={pending} />}
      </div>
    </div>
  )
}

function Head({ life, title, text }: { life: Life; title: string; text?: string }) {
  return (
    <>
      <span className="label">Event · age {life.age}</span>
      <h2 id="event-title">{title}</h2>
      {text && <p>{text}</p>}
    </>
  )
}

function Choice({ life, def, pending }: { life: Life; def: EventDef; pending: PendingEvent }) {
  const decide = useApp((s) => s.decide)
  const actions = availableActions(life, def, pending.cast)
  const manners = def.manners ?? DEFAULT_MANNERS
  const [picked, setPicked] = useState({ what: 0, how: 0 })
  const what = Math.min(picked.what, actions.length - 1) // a setting change can take an option away
  const rows = useRef<HTMLDivElement>(null)
  const focusOption = (row: number, i: number) => rows.current?.querySelectorAll('.opts')[row]?.querySelectorAll('button')[i]?.focus()
  useEffect(() => focusOption(0, 0), [])

  const go = () => decide(actions[what]!.action.id, manners[picked.how]!.id)
  const onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const n = /^[1-5]$/.test(e.key) ? Number(e.key) - 1 : -1
    if (n >= 0 && n < actions.length) {
      e.preventDefault()
      play('tap')
      setPicked((p) => ({ ...p, what: n }))
      focusOption(0, n)
    } else if (e.key === 'Enter' && !e.repeat) {
      e.preventDefault() // Enter decides from anywhere, not only on the Decide button
      go()
    }
  }
  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- catches keys bubbling up from the options and Decide inside
    <div className="evb" ref={rows} onKeyDown={onKey}>
      <Head life={life} title={fill(def.title, life, pending.cast)} text={fill(def.text, life, pending.cast)} />
      <Options
        label="What do you do?"
        id="ev-what"
        items={actions.map((a, i) => ({ id: a.action.id, label: a.action.label, note: a.openNote, key: i + 1 }))}
        chosen={what}
        onChoose={(i) => setPicked((p) => ({ ...p, what: i }))}
      />
      <Options label="How?" id="ev-how" items={manners.map((m) => ({ id: m.id, label: m.label, note: null }))} chosen={picked.how} onChoose={(i) => setPicked((p) => ({ ...p, how: i }))} />
      <button className="primary" onClick={go}>
        Decide
      </button>
    </div>
  )
}

interface OptionsProps {
  label: string
  id: string
  items: { id: string; label: string; note: string | null; key?: number }[]
  chosen: number
  onChoose(i: number): void
}

/** One row of toggles; only the chosen one is in the Tab order, the arrow keys move along the row. */
function Options({ label, id, items, chosen, onChoose }: OptionsProps) {
  const choose = (i: number, el: HTMLElement | null) => {
    play('tap')
    onChoose(i)
    el?.focus()
  }
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const next = (i + step + items.length) % items.length
    choose(next, e.currentTarget.parentElement!.children[next] as HTMLElement)
  }
  return (
    <>
      <span className="label" id={id}>
        {label}
      </span>
      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a fieldset would bring its own border and padding */}
      <div className="opts" role="group" aria-labelledby={id}>
        {items.map((o, i) => (
          <button key={o.id} className="opt" aria-pressed={i === chosen} tabIndex={i === chosen ? 0 : -1} onClick={(e) => choose(i, e.currentTarget)} onKeyDown={(e) => onKey(e, i)}>
            {o.label}
            {o.note && <small>{o.note}</small>}
          </button>
        ))}
      </div>
    </>
  )
}

function Outcome({ life, title, tier, entry }: { life: Life; title: string; tier: EventTier; entry: JournalEntry }) {
  const closeEvent = useApp((s) => s.closeEvent)
  const back = useRef<HTMLButtonElement>(null)
  useEffect(() => back.current?.focus(), [])
  useEffect(() => play(SOUND[tier]), [tier])
  return (
    <div className="evb">
      <Head life={life} title={title} />
      <div className="mf">
        <div className="res">
          {entry.text}
          <Changes changes={entry.changes} />
          <Closeness moved={entry.people} people={life.people} />
        </div>
        <button className="primary" ref={back} onClick={closeEvent}>
          Back to your year
        </button>
      </div>
    </div>
  )
}
