import type { ContentPack } from '../content/types'
import { createRng } from '../engine/random'
import { finishActivity, offersFor } from '../life/activities'
import { energyLeft } from '../life/energy'
import { availableActions, DEFAULT_MANNERS, drawEvents, dropStale, resolveEvent } from '../life/events'
import { findMove, pathActions, takePath } from '../life/path'
import { jobBoard } from '../life/work'
import { rollLife } from '../life/roll'
import { stageOf } from '../life/stages'
import type { Life } from '../life/types'
import { ageUp, newLife } from '../life/year'

const MAX_AGE = 130
const MAX_PLAYS = 50 // zero-cost activities (skip class, save at the bank) never spend energy; stop a year that only finds those

export interface SimLife { life: Life; jobAt30: boolean; moneyAt40: number | null; offered: Set<string> }

/** Plays one random life from birth to death: the balance guard for the death odds and the content. */
export function simulateLife(seed: number, pack: ContentPack): SimLife {
  const rng = createRng(seed)
  const { name, gender, city, wealth } = rollLife(seed)
  let life = drawEvents(newLife({ seed, name, gender, city, wealth, startAge: 0 }), pack)
  const offered = new Set<string>()
  let jobAt30 = false
  let moneyAt40: number | null = null
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
    if (life.school.at === null && rng.next() < 0.8) {
      const open = pathActions(life, pack).filter((m) => (m.id === 'sma' || m.id === 'smk') && !m.blocked)
      if (open.length > 0) life = takePath(life, rng.pick(open).id, pack)
    }
    if (life.age >= 18 && !life.job && rng.next() < 0.5) {
      const open = jobBoard(life, pack).filter((m) => !m.blocked)
      if (open.length > 0) life = takePath(life, rng.pick(open).id, pack)
    }
    if (life.flags.includes('passed-entrance') && life.school.at === null && life.school.degrees.length === 0 && rng.next() < 0.5) {
      const open = pathActions(life, pack).filter((m) => m.id.startsWith('uni:') && !m.blocked)
      if (open.length > 0) life = takePath(life, rng.pick(open).id, pack)
    }
    if (life.age >= 60 && life.job && rng.next() < 0.3 && !findMove(life, 'retire', pack)!.blocked) life = takePath(life, 'retire', pack)
    for (const c of stageOf(life.age).categories) for (const o of offersFor(life, c, pack)) if (!o.blocked) offered.add(o.def.id)
    if (life.age === 30) jobAt30 = life.job !== null
    if (life.age === 40) moneyAt40 = life.money
    for (let plays = 0; plays < MAX_PLAYS && energyLeft(life) > 0; plays++) {
      const open = stageOf(life.age).categories
        .map((c) => offersFor(life, c, pack).filter((o) => !o.blocked))
        .filter((offers) => offers.length > 0) // a category can be all blocked (no money, no parent); the offers themselves always exist
      if (open.length === 0) break
      life = finishActivity(life, rng.pick(rng.pick(open)).def, rng.next()).life
    }
    life = ageUp(life, pack)
    if (!life.death) life = drawEvents(life, pack)
  }
  return { life, jobAt30, moneyAt40, offered }
}
