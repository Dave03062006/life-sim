import { play } from '../../app/sound'
import { useApp } from '../../app/store'
import { packFor } from '../../content'
import { formatRupiah } from '../../life/format'
import { LIFESTYLE, LIVING_WITH_FAMILY, sellBlocked } from '../../life/money'
import type { Life, Lifestyle } from '../../life/types'

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

/** Your lifestyle (once you live on your own) and the big things you own, each with a Sell button. */
export function MoneyPanel({ life }: { life: Life }) {
  const setLifestyle = useApp((s) => s.setLifestyle)
  const sell = useApp((s) => s.sell)
  const pack = packFor(life.country)
  const owned = life.belongings.flatMap((id) => pack.belongings.find((b) => b.id === id) ?? [])
  return (
    <section className="people" aria-label="Your money">
      {life.ownWay ? (
        <fieldset className="lifestyle">
          <legend>Lifestyle</legend>
          {(Object.keys(LIFESTYLE) as Lifestyle[]).map((key) => {
            const l = LIFESTYLE[key]
            return (
              <label key={key} className="opt">
                <input type="radio" name="lifestyle" checked={life.lifestyle === key} onChange={() => {
                    play('tap')
                    setLifestyle(key)
                  }}
                />
                <span style={{ textTransform: 'capitalize' }}>{l.label}</span>
                <small>
                  {formatRupiah(l.cost)} a year · Happiness {signed(l.happiness)} · Health {signed(l.health)}
                </small>
              </label>
            )
          })}
        </fieldset>
      ) : (
        <p>{LIVING_WITH_FAMILY}</p>
      )}
      <h3>Things you own</h3>
      {owned.length === 0 && <p>You don't own anything big yet.</p>}
      <ul className="owned">
        {owned.map((b) => {
          const why = sellBlocked(life, b.id, pack)
          return (
            <li key={b.id}>
              <span>
                {b.name}
                {why && <small className="why">{why}</small>}
              </span>
              <button className="ghost" disabled={why !== null} onClick={() => {
                  play('tap')
                  sell(b.id)
                }}
              >
                Sell for {formatRupiah(b.resale)}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
