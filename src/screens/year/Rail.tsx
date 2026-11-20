import { energyLeft } from '../../life/energy'
import { formatRupiah } from '../../life/format'
import { stageOf } from '../../life/stages'
import type { Life } from '../../life/types'
import { scenePath } from '../../styles/art'
import { StatBar } from '../../ui/StatBar'

/** The character: their room, who they are, their stats and money. */
export function Rail({ life }: { life: Life }) {
  const stage = stageOf(life.age).id
  const alt = `${life.name} at home`
  const { stats } = life
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
        <StatBar stat="health" value={stats.health} />
        <StatBar stat="happiness" value={stats.happiness} />
        <StatBar stat="smarts" value={stats.smarts} />
        <StatBar stat="looks" value={stats.looks} />
        <div className="rule" />
        <div className="money">
          <span>Pocket money</span>
          <b>{formatRupiah(life.money)}</b>
        </div>
        <div className="rule" />
        <StatBar stat="stress" value={stats.stress} minor />
        <StatBar stat="reputation" value={stats.reputation} minor />
      </section>
    </aside>
  )
}
