import { create } from 'zustand'
import { packFor } from '../content'
import type { ActivityDef, EventDef, ResultTier } from '../content/types'
import { createRng, randomSeed } from '../engine/random'
import { createSaves, type Saves } from '../engine/save/saves'
import { indexedDbStore, memoryStore } from '../engine/save/storage'
import { useSettings } from '../engine/settings'
import { finishActivity, GOOD_SCORE, offersFor } from '../life/activities'
import { drawEvents, dropStale, resolveEvent, type EventTier } from '../life/events'
import { modifiersFor } from '../life/modifiers'
import { personById } from '../life/people'
import { actionsFor, afterEvent, giveGift, queuePersonEvent, talk, timeActivity, type PersonActionId } from '../life/personActions'
import type { CategoryId, Interest, JournalEntry, Life, PendingEvent } from '../life/types'
import { ageUp, newLife } from '../life/year'
import type { Modifiers } from '../minigames/framework'

export interface AppState {
  ready: boolean
  life: Life | null
  openCategory: CategoryId | null
  playing: { def: ActivityDef; mods: Modifiers; seed: number; personId?: string } | null
  lastResult: { def: ActivityDef; tier: ResultTier; entry: JournalEntry } | null
  birthday: number | null
  settingsOpen: boolean
  pendingEvent: PendingEvent | null // life.pendingEvents[0] once nothing else is showing
  askingInterest: boolean
  lastEvent: { def: EventDef; tier: EventTier; entry: JournalEntry } | null
  boot(saves?: Saves): Promise<void>
  startDemoLife(seed?: number): void // Plan 1 only; Plan 4 replaces it with the roll screen.
  open(category: CategoryId | null): void
  begin(activityId: string): void // a blocked activity is ignored; one with no mini-game finishes at once as Good
  finish(score: number): void // acts once per activity
  closeResult(): void
  ageUp(): void
  endBirthday(): void
  setSettingsOpen(open: boolean): void
  decide(actionId: string, mannerId: string): void
  closeEvent(): void
  setInterest(interest: Interest): void // answers the romance question, or changes the answer later
  personAction(personId: string, action: PersonActionId): void
}

let saves: Saves | null = null
let booting: Promise<void> | null = null
let loading = false
let past: Life[] = []
const persist = (life: Life) => void saves?.store({ version: 2, active: life, past }).catch(() => {}) // a failed save must not break the game
const localSaves = (): Saves => {
  try {
    return createSaves(indexedDbStore('life-sim', 'saves'))
  } catch {
    return createSaves(memoryStore()) // no browser storage: play on, unsaved
  }
}
/** A dialog is up or a turn is under way: nothing else may start. */
const busy = (s: AppState) =>
  !s.life || s.playing !== null || s.lastResult !== null || s.birthday !== null || s.pendingEvent !== null || s.lastEvent !== null || s.askingInterest
/** Runs once the romance question is answered; null means show the next event. */
let resume: (() => void) | null = null
/** The first pending event that can show, or the romance question before one with a romance option; saves any dropped. */
function showNext(given: Life): Partial<AppState> {
  const pack = packFor(given.country)
  const life = dropStale(given, pack)
  if (life !== given) persist(life)
  const pending = life.pendingEvents[0] ?? null
  const ev = pending && pack.events.find((e) => e.id === pending.eventId)
  if (life.interest === null && ev?.actions?.some((a) => a.romance)) {
    resume = null
    return { life, pendingEvent: null, askingInterest: true }
  }
  return { life, pendingEvent: pending }
}

export const useApp = create<AppState>()((set, get) => {
  const play = (life: Life, def: ActivityDef, personId?: string) => {
    const rng = createRng(life.rng)
    const seed = rng.int(0, 2 ** 31)
    const advanced = { ...life, rng: rng.state }
    persist(advanced) // a reload mid-game must not replay the same seed
    set({ life: advanced, playing: { def, mods: modifiersFor(life, def, useSettings.getState().relaxed), seed, personId } })
  }
  const saveAndShow = (life: Life) => {
    persist(life)
    set({ life, ...showNext(life) })
  }
  return {
    ready: false,
    life: null,
    openCategory: null,
    playing: null,
    lastResult: null,
    birthday: null,
    settingsOpen: false,
    pendingEvent: null,
    askingInterest: false,
    lastEvent: null,
    boot(given) {
      // StrictMode runs the boot effect twice: share one load, never reload over newer play.
      if (booting && (loading || get().ready)) return booting
      loading = true
      saves = given ?? localSaves()
      booting = saves
        .load()
        .then((file) => {
          past = file.past
          set({ ready: true, life: file.active, ...(file.active && showNext(file.active)) })
        })
        .finally(() => {
          loading = false
        })
      return booting
    },
    startDemoLife(seed = randomSeed()) {
      const life = drawEvents(newLife({ seed, startAge: 15 }), packFor('indonesia'))
      saveAndShow(life)
    },
    open: (openCategory) => set({ openCategory }),
    begin(activityId) {
      const { life } = get()
      if (!life || busy(get())) return
      const pack = packFor(life.country)
      const def = pack.activities.find((a) => a.id === activityId)
      if (!def) return
      const offer = offersFor(life, def.category, pack).find((o) => o.def.id === activityId)
      if (!offer || offer.blocked) return
      if (def.minigame) return play(life, def)
      const { life: next, tier, entry } = finishActivity(life, def, GOOD_SCORE)
      set({ life: next, lastResult: { def, tier, entry } })
      persist(next)
    },
    finish(score) {
      const { life, playing, lastResult } = get()
      if (!life || !playing || lastResult) return
      const { life: next, tier, entry } = finishActivity(life, playing.def, score, playing.personId)
      set({ life: next, lastResult: { def: playing.def, tier, entry } })
      persist(next)
    },
    closeResult: () => set({ playing: null, lastResult: null }),
    ageUp() {
      const { life } = get()
      if (!life || busy(get())) return
      const pack = packFor(life.country)
      const next = drawEvents(ageUp(life, pack), pack)
      set({ life: next, birthday: next.age, openCategory: null })
      persist(next)
    },
    endBirthday() {
      const { life } = get()
      set({ birthday: null, ...(life && showNext(life)) })
    },
    setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
    decide(actionId, mannerId) {
      const { life, pendingEvent, lastEvent } = get()
      if (!life || !pendingEvent || lastEvent) return
      const pack = packFor(life.country)
      const def = pack.events.find((e) => e.id === pendingEvent.eventId)!
      const resolved = resolveEvent(life, pack, actionId, mannerId)
      const next = afterEvent(resolved.life, pendingEvent.eventId, pendingEvent.cast, resolved.tier)
      if (resolved.skipped) return saveAndShow(next) // skipped silently
      persist(next)
      set({ life: next, pendingEvent: null, lastEvent: { def, tier: resolved.tier, entry: resolved.entry } })
    },
    closeEvent() {
      const { life, lastEvent } = get()
      if (!life || !lastEvent) return
      set({ lastEvent: null, ...showNext(life) })
    },
    setInterest(interest) {
      const { life, askingInterest } = get()
      if (!life) return
      const next = { ...life, interest }
      persist(next)
      if (!askingInterest) return set({ life: next }) // changed later, from Settings
      set({ life: next, askingInterest: false })
      const then = resume
      resume = null
      if (then) then()
      else set(showNext(next))
    },
    personAction(personId, action) {
      const { life } = get()
      if (!life || busy(get())) return
      const person = personById(life, personId)
      const offer = actionsFor(life, personId).find((a) => a.id === action)
      if (!person || !offer || offer.blocked) return
      if (action === 'time') return play(life, timeActivity(person), personId)
      if (action === 'gift') {
        const { life: next } = giveGift(life, personId)
        persist(next)
        return set({ life: next })
      }
      if (action === 'ask-out' && life.interest === null) {
        set({ askingInterest: true })
        resume = () => get().personAction(personId, action)
        return
      }
      saveAndShow(action === 'talk' ? talk(life, personId) : queuePersonEvent(life, action, personId))
    },
  }
})
