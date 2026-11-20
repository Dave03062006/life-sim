import { useState } from 'react'
import { useApp } from '../../app/store'
import { energyLeft } from '../../life/energy'
import { formatRupiah } from '../../life/format'
import { stageOf } from '../../life/stages'
import { isBenefit } from '../../life/stats'
import type { Change, Life, StatKey } from '../../life/types'
import { scenePath } from '../../styles/art'
import { StatBar } from '../../ui/StatBar'

const deltaText = ({ key, delta }: Change) => (key === 'money' ? `${delta > 0 ? '+' : ''}${formatRupiah(delta)}` : `${delta > 0 ? '+' : '−'}${Math.abs(delta)}`)

/** The newest result's changes, numbered so each new result floats its numbers again. */
function useLastChanges() {
  const entry = useApp((s) => s.lastResult?.entry ?? null)
  const [last, setLast] = useState({ entry, n: 0 })
  if (entry && entry !== last.entry) setLast({ entry, n: last.n + 1 })
  return last
}

/** The character: their room, who they are, their stats and money. */
export function Rail({ life }: { life: Life }) {
  const stage = stageOf(life.age).id
  const alt = `${life.name} at home`
  const { stats } = life
  const last = useLastChanges()
  // a floating number beside each changed stat, rising and fading (the .delta rise animation)
  const delta = (key: StatKey | 'money') => {
    const change = last.n ? last.entry?.changes.find((c) => c.key === key) : undefined
    return (
      change && (
        <span key={last.n} className={`delta ${isBenefit(change.key, change.delta) ? 'up' : 'down'}`}>
          {deltaText(change)}
        </span>
      )
    )
  }
  const bar = (stat: StatKey, minor?: boolean) => (
    <StatBar stat={stat} value={stats[stat]} minor={minor}>
      {delta(stat)}
    </StatBar>
  )
  return (
    <aside className="rail">
      <figure className="scene">
        <img className="fl" src={scenePath(stage, life.gender, 'flat')} alt={alt} />
        <img className="px" src={scenePath(stage, life.gender, 'pixel')} alt={alt} />
        <figcaption className="badges">{energyLeft(life) < 0 && <span className="badge">Overworked</span>}</figcaption>
      </figure>
      <div className="who">
        <h1>{life.name}</h1>
        <p>
          {life.age} years old · {life.city}
        </p>
      </div>
      <section className="card stats" aria-label="Stats">
        {bar('health')}
        {bar('happiness')}
        {bar('smarts')}
        {bar('looks')}
        <div className="rule" />
        <div className="money">
          <span>Pocket money</span>
          <b>{formatRupiah(life.money)}</b>
          {delta('money')}
        </div>
        <div className="rule" />
        {bar('stress', true)}
        {bar('reputation', true)}
      </section>
    </aside>
  )
}
