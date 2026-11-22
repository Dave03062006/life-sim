import { useCallback, useLayoutEffect, useRef } from 'react'
import { play } from '../../app/sound'
import { packFor } from '../../content'
import { type ActivityOffer, offersFor } from '../../life/activities'
import { formatRupiah } from '../../life/format'
import type { CategoryId, Life } from '../../life/types'
import { Icon } from '../../ui/Icon'
import { CATEGORY, categoryLabel } from './labels'
import { MoneyPanel } from './MoneyPanel'
import { PathPanel } from './PathPanel'
import { PeopleList } from './PeopleList'

function chips(offer: ActivityOffer): { text: string; tone?: 'up' | 'down' }[] {
  const { def, energyGain, overwork, timesDone } = offer
  const out: { text: string; tone?: 'up' | 'down' }[] = []
  if (def.rest !== undefined) out.push(energyGain ? { text: `+${energyGain} energy`, tone: 'up' } : { text: 'No more energy from rest this year' })
  else if (def.energy > 0) out.push(overwork ? { text: `${def.energy} energy · overwork`, tone: 'down' } : { text: `${def.energy} energy` })
  else if (energyGain > 0) out.push({ text: `+${energyGain} energy`, tone: 'up' })
  else out.push({ text: 'No energy' })
  if (def.minigame) out.push({ text: `${def.minigame.type[0]!.toUpperCase()}${def.minigame.type.slice(1)} game` })
  if (def.money) out.push({ text: `${def.money > 0 ? '+' : ''}${formatRupiah(def.money)}`, tone: def.money > 0 ? 'up' : undefined })
  if (timesDone) out.push({ text: `Done ${timesDone}× · smaller gains` })
  return out
}

function Card({ offer, onBegin }: { offer: ActivityOffer; onBegin(id: string): void }) {
  const { def, blocked, openNote } = offer
  return (
    <button className="act" data-id={def.id} disabled={blocked !== null} onClick={() => {
        play('tap')
        onBegin(def.id)
      }}
    >
      <Icon id={def.icon} fallback={`cat-${def.category}`} />
      <span>
        <span className="t">
          {def.title}
          {openNote && <span className="pill q">{openNote}</span>}
        </span>
        <span className="d">{def.description}</span>
        {blocked ? (
          <span className="why">{blocked}</span>
        ) : (
          <span className="meta">
            {chips(offer).map((c) => (
              <span key={c.text} className={c.tone ? `chip ${c.tone}` : 'chip'}>
                {c.text}
              </span>
            ))}
          </span>
        )}
      </span>
    </button>
  )
}

interface SheetProps {
  life: Life
  category: CategoryId
  onBegin(id: string): void
  onClose(): void
  /** Reports the sheet's height, so the journal can keep its newest line above it. */
  onHeight(px: number): void
}

/** The activities of one category, rising over the journal. */
export function ActivitySheet({ life, category, onBegin, onClose, onHeight }: SheetProps) {
  const sheet = useRef<HTMLElement>(null)
  const offers = offersFor(life, category, packFor(life.country))
  const { blurb } = CATEGORY[category]
  const label = categoryLabel(life, category)

  const measure = useCallback(() => onHeight(sheet.current?.offsetHeight ?? 0), [onHeight])
  useLayoutEffect(() => measure(), [category, offers.length, measure])
  useLayoutEffect(() => () => onHeight(0), [onHeight])

  return (
    <section className="card sheet" aria-label="Activities" ref={sheet}>
      <header className="sh">
        <div>
          <h2>{label}</h2>
          <p>{blurb}</p>
        </div>
        <button className="ghost" onClick={onClose}>
          Close<kbd>Esc</kbd>
        </button>
      </header>
      <div className="grid">
        {category === 'school' && <PathPanel life={life} onLayout={measure} />}
        {category === 'money' && <MoneyPanel life={life} />}
        {category === 'people' && <PeopleList life={life} onLayout={measure} />}
        {offers.length === 0 && <p>Nothing to do here at this age yet.</p>}
        {offers.map((o) => (
          <Card key={o.def.id} offer={o} onBegin={onBegin} />
        ))}
      </div>
    </section>
  )
}
