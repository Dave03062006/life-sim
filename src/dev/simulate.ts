import type { ContentPack } from '../content/types'
import { createRng } from '../engine/random'
import { finishActivity, offersFor } from '../life/activities'
import { energyLeft } from '../life/energy'
import { availableActions, DEFAULT_MANNERS, drawEvents, dropStale, resolveEvent } from '../life/events'
import { rollLife } from '../life/roll'
import { stageOf } from '../life/stages'
import type { Life } from '../life/types'
import { ageUp, newLife } from '../life/year'

const MAX_AGE = 130
const MAX_PLAYS = 50 // zero-cost activities (skip class, save at the bank) never spend energy; stop a year that only finds those

/** Plays one random life from birth to death: the balance guard for the death odds and the content. */
export function simulateLife(seed: number, pack: ContentPack): Life {
  const rng = createRng(seed)
  const { name, gender, city, wealth } = rollLife(seed)
  let life = drawEvents(newLife({ seed, name, gender, city, wealth, startAge: 0 }), pack)
  while (!life.death) {
    if (life.age >= MAX_AGE) throw new Error(`Life ${seed} reached ${MAX_AGE}`)
    for (life = dropStale(life, pack); life.pendingEvents[0]; life = dropStale(life, pack)) {
      const pending = life.pendingEvents[0]
      const ev = pack.events.find((e) => e.id === pending.eventId)!
      const actions = availableActions(life, ev, pending.cast)
      if (actions.length === 0) throw new Error(`Life ${seed}: ${ev.id} has no open action at ${life.age}`)
      const manner = rng.pick(ev.manners ?? DEFAULT_MANNERS)
      life = resolveEvent(life, pack, rng.pick(actions).action.id, manner.id).life
    }
    for (let plays = 0; plays < MAX_PLAYS && energyLeft(life) > 0; plays++) {
      const open = stageOf(life.age).categories
        .map((c) => offersFor(life, c, pack).filter((o) => !o.blocked))
        .filter((offers) => offers.length > 0) // an empty category is Task 3's to fill
      if (open.length === 0) break
      life = finishActivity(life, rng.pick(rng.pick(open)).def, rng.next()).life
    }
    life = ageUp(life, pack)
    if (!life.death) life = drawEvents(life, pack)
  }
  return life
}
