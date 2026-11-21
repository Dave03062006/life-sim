import { create } from 'zustand'
import { packFor } from '../content'
import type { ActivityDef, ResultTier } from '../content/types'
import { createRng, randomSeed } from '../engine/random'
import { createSaves, type Saves } from '../engine/save/saves'
import { indexedDbStore, memoryStore } from '../engine/save/storage'
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
  playing: { def: ActivityDef; mods: Modifiers; seed: number } | null
  lastResult: { def: ActivityDef; tier: ResultTier; entry: JournalEntry } | null
  birthday: number | null
  settingsOpen: boolean
  boot(saves?: Saves): Promise<void>
  startDemoLife(seed?: number): void // Plan 1 only; Plan 4 replaces it with the roll screen.
  open(category: CategoryId | null): void
  begin(activityId: string): void // a blocked activity is ignored; one with no mini-game finishes at once as Good
  finish(score: number): void // acts once per activity
  closeResult(): void
  ageUp(): void
  endBirthday(): void
  setSettingsOpen(open: boolean): void
}

let saves: Saves | null = null
let booting: Promise<void> | null = null
let loading = false
let past: Life[] = []
const persist = (life: Life) => void saves?.store({ version: 1, active: life, past }).catch(() => {}) // a failed save must not break the game
const localSaves = (): Saves => {
  try {
    return createSaves(indexedDbStore('life-sim', 'saves'))
  } catch {
    return createSaves(memoryStore()) // no browser storage: play on, unsaved
  }
}
/** A dialog is up or a turn is under way: nothing else may start. */
const busy = (s: AppState) => !s.life || s.playing !== null || s.lastResult !== null || s.birthday !== null

export const useApp = create<AppState>()((set, get) => ({
  ready: false,
  life: null,
  openCategory: null,
  playing: null,
  lastResult: null,
  birthday: null,
  settingsOpen: false,
  boot(given) {
    // StrictMode runs the boot effect twice: share one load, never reload over newer play.
    if (booting && (loading || get().ready)) return booting
    loading = true
    saves = given ?? localSaves()
    booting = saves
      .load()
      .then((file) => {
        past = file.past
        set({ ready: true, life: file.active })
      })
      .finally(() => {
        loading = false
      })
    return booting
  },
  startDemoLife(seed = randomSeed()) {
    const life = newLife({ seed, startAge: 15 })
    set({ life })
    persist(life)
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
    if (def.minigame) {
      const rng = createRng(life.rng)
      const seed = rng.int(0, 2 ** 31)
      set({ life: { ...life, rng: rng.state }, playing: { def, mods: modifiersFor(life, def, useSettings.getState().relaxed), seed } })
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
    if (!life || busy(get())) return
    const next = ageUp(life, packFor(life.country))
    set({ life: next, birthday: next.age, openCategory: null })
    persist(next)
  },
  endBirthday: () => set({ birthday: null }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
}))
