import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { Skin } from '../styles/art'

/** Settings that belong to this device rather than to a save file. */
export interface DeviceSettings {
  style: Skin
  sound: boolean
  /** 'system' follows the device's own "reduce motion" setting. */
  reducedMotion: 'system' | 'on' | 'off'
  /** Gentler mini-games (see modifiersFor). */
  relaxed: boolean
}

export const DEFAULT_SETTINGS: DeviceSettings = { style: 'flat', sound: true, reducedMotion: 'system', relaxed: false }

interface SettingsStore extends DeviceSettings {
  update(changes: Partial<DeviceSettings>): void
  reset(): void
}

/** localStorage can be missing or blocked (private windows). Settings then simply are not kept. */
const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      // Not saved, but the game keeps working.
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      // Nothing to do.
    }
  },
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (changes) => set(changes),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'life-sim-settings',
      version: 1,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: ({ update: _update, reset: _reset, ...settings }) => settings,
    },
  ),
)

/** Whether motion should be reduced, combining the setting with the device preference. */
export function prefersReducedMotion(setting: DeviceSettings['reducedMotion'], deviceWantsLess: boolean): boolean {
  if (setting === 'on') return true
  if (setting === 'off') return false
  return deviceWantsLess
}
