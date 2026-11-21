import { packFor } from '../content'
import type { ActivityDef, MinigameType } from '../content/types'
import type { EventTier } from './events'
import { formatRupiah } from './format'
import { nudgeCloseness, personById } from './people'
import { STAGES } from './stages'
import { applyChanges } from './stats'
import type { JournalEntry, Life, Person, Relation } from './types'

export type PersonActionId = 'time' | 'talk' | 'gift' | 'ask-out'
export interface PersonAction { id: PersonActionId; label: string; blocked: string | null; detail: string }
export const GIFT_PRICE = 50_000
export const GIFT_CLOSENESS = 10
export const ASK_OUT_CLOSENESS = 50
export const ASK_OUT_AGE = 15

const GAMES: Record<Relation, { type: MinigameType; theme: string }> = {
  mother: { type: 'catch', theme: 'cook' },
  father: { type: 'catch', theme: 'cook' },
  sibling: { type: 'tapping', theme: 'time' },
  grandparent: { type: 'memory', theme: 'chess' },
  friend: { type: 'tapping', theme: 'time' },
  crush: { type: 'tapping', theme: 'time' },
  partner: { type: 'timing', theme: 'time' },
}

const giftBlocked = (life: Life): string | null =>
  life.money < GIFT_PRICE ? `You need ${formatRupiah(GIFT_PRICE)}. You have ${formatRupiah(life.money)}.` : null

export function actionsFor(life: Life, personId: string): PersonAction[] {
  const person = personById(life, personId)
  if (!person) return []
  const events = packFor(life.country).events
  const missing = (id: string) => (events.some((e) => e.id === id) ? null : 'Not available yet.')
  const { name } = person
  const actions: PersonAction[] = [
    { id: 'time', label: 'Spend time', blocked: null, detail: `Do something together with ${name}.` },
    { id: 'talk', label: 'Talk', blocked: missing('talk'), detail: `See what is on ${name}'s mind.` },
    { id: 'gift', label: 'Give a gift', blocked: giftBlocked(life), detail: `${formatRupiah(GIFT_PRICE)}. Closeness +${GIFT_CLOSENESS}.` },
  ]
  if (person.relation === 'crush') {
    const blocked = missing('ask-out') ??
      (life.age < ASK_OUT_AGE ? `You need to be ${ASK_OUT_AGE}.` : person.closeness < ASK_OUT_CLOSENESS ? 'You are not close enough yet.' : null)
    actions.push({ id: 'ask-out', label: 'Ask out', blocked, detail: `Ask ${name} to be your partner.` })
  }
  return actions
}

export function timeActivity(person: Person): ActivityDef {
  const { name } = person
  return {
    id: `time:${person.id}`,
    category: 'people',
    title: `Time with ${name}`,
    description: `An afternoon with ${name}.`,
    icon: 'act-time',
    stages: STAGES.map((s) => s.id),
    minigame: GAMES[person.relation],
    energy: 1,
    effects: { happiness: 3 },
    lines: {
      great: `You and ${name} had a wonderful time together.`,
      good: `You spent a good afternoon with ${name}.`,
      weak: `You and ${name} hung out. It was a little awkward.`,
      fail: `Time with ${name} did not go well.`,
    },
  }
}

export function giveGift(life: Life, personId: string): { life: Life; entry: JournalEntry } {
  const person = personById(life, personId)
  if (!person) throw new Error(`No person ${personId}`)
  const blocked = giftBlocked(life)
  if (blocked) throw new Error(`Gift is blocked: ${blocked}`)
  const { life: next, moved } = nudgeCloseness(applyChanges(life, [{ key: 'money', delta: -GIFT_PRICE }]), personId, GIFT_CLOSENESS)
  const entry: JournalEntry = { age: life.age, kind: 'activity', text: `You gave ${person.name} a gift.`, changes: [{ key: 'money', delta: -GIFT_PRICE }], people: moved }
  return { life: { ...next, journal: [...next.journal, entry] }, entry }
}

/** Queues a built-in person event (`talk`, `ask-out`) with the person cast as `them`. */
export const queuePersonEvent = (life: Life, eventId: 'talk' | 'ask-out', personId: string): Life =>
  ({ ...life, pendingEvents: [...life.pendingEvents, { eventId, cast: { them: personId } }] })

/** Rules that follow an event's result: a successful ask-out makes the crush a partner. */
export function afterEvent(life: Life, eventId: string, cast: Record<string, string>, tier: EventTier): Life {
  if (eventId !== 'ask-out' || tier !== 'success' || !cast.them) return life
  return { ...life, people: life.people.map((p) => (p.id === cast.them && p.relation === 'crush' ? { ...p, relation: 'partner' } : p)) }
}
