import { packFor } from '../../content'
import { knownIllnesses } from '../../life/illness'
import type { Life } from '../../life/types'

const NOTE = { controlled: 'Controlled this year.', eased: 'Eased this year.' } as const

/** The illnesses you know about, with how they feel; the treatments are the cards below. */
export function HealthPanel({ life }: { life: Life }) {
  const pack = packFor(life.country)
  const known = knownIllnesses(life)
  if (known.length === 0) return null
  return (
    <section aria-labelledby="your-health">
      <h3 id="your-health">Your health</h3>
      {known.map((i) => {
        const def = pack.illnesses.find((d) => d.id === i.id)
        return (
          <p key={i.id}>
            <b>{def?.name}</b> {def?.symptoms} {i.treated && i.treated !== 'cured' && NOTE[i.treated]}
          </p>
        )
      })}
    </section>
  )
}
