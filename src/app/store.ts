import { create } from 'zustand'
import { packFor } from '../content'
import type { ActivityDef, ResultTier } from '../content/types'
import { randomSeed } from '../engine/random'
import { createSaves, type Saves } from '../engine/save/saves'
import { indexedDbStore } from '../engine/save/storage'
import { useSettings } from '../engine/settings'
import { finishActivity, GOOD_SCORE, offersFor } from '../life/activities'
import { modifiersFor } from '../life/modifiers'
import type { CategoryId, JournalEntry, Life } from '../life/types'
import { ageUp, newLife } from '../life/year'
import type { Modifiers } from '../minigames/framework'

export interface AppState {
  ready: boolean
  life: Life | null
  openCategory: CategoryId | null
  playing: { def: ActivityDef; mods: Modifiers } | null
  lastResult: { def: ActivityDef; tier: ResultTier; entry: JournalEntry } | null
  birthday: number | null
  boot(saves?: Saves): Promise<void>
  startDemoLife(seed?: number): void // Plan 1 only; Plan 4 replaces it with the roll screen.
  open(category: CategoryId | null): void
  begin(activityId: string): void // a blocked activity is ignored; one with no mini-game finishes at once as Good
  finish(score: number): void // acts once per activity
  closeResult(): void
  ageUp(): void
  endBirthday(): void
}

let saves: Saves | null = null
const persist = (life: Life) => void saves?.store({ version: 1, active: life, past: [] }).catch(() => {}) // a failed save must not break the game

export const useApp = create<AppState>()((set, get) => ({
  ready: false,
  life: null,
  openCategory: null,
  playing: null,
  lastResult: null,
  birthday: null,
  async boot(given) {
    if (get().ready) return // StrictMode runs the boot effect twice
    saves = given ?? createSaves(indexedDbStore('life-sim', 'saves'))
    const file = await saves.load()
    set({ ready: true, life: file.active })
  },
  startDemoLife(seed = randomSeed()) {
    const life = newLife({ seed, startAge: 15 })
    set({ life })
    persist(life)
  },
  open: (openCategory) => set({ openCategory }),
  begin(activityId) {
    const { life } = get()
    if (!life) return
    const pack = packFor(life.country)
    const def = pack.activities.find((a) => a.id === activityId)
    if (!def) return
    const offer = offersFor(life, def.category, pack).find((o) => o.def.id === activityId)
    if (!offer || offer.blocked) return
    if (def.minigame) {
      set({ playing: { def, mods: modifiersFor(life, def, useSettings.getState().relaxed) } })
      return
    }
    const { life: next, tier, entry } = finishActivity(life, def, GOOD_SCORE)
    set({ life: next, lastResult: { def, tier, entry } })
    persist(next)
  },
  finish(score) {
    const { life, playing, lastResult } = get()
    if (!life || !playing || lastResult) return
    const { life: next, tier, entry } = finishActivity(life, playing.def, score)
    set({ life: next, lastResult: { def: playing.def, tier, entry } })
    persist(next)
  },
  closeResult: () => set({ playing: null, lastResult: null }),
  ageUp() {
    const { life } = get()
    if (!life) return
    const next = ageUp(life, packFor(life.country))
    set({ life: next, birthday: next.age, openCategory: null })
    persist(next)
  },
  endBirthday: () => set({ birthday: null }),
}))
