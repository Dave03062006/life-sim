import type { ResultTier } from '../content/types'
import { useSettings } from '../engine/settings'

export type Sound = 'tap' | 'open' | 'ok' | 'good' | 'bad' | 'age'

let ac: AudioContext | undefined

/** One short synth note, from the mockup: a triangle wave in Flat, a square wave in Pixel. */
function tone(freq: number, dur = 0.12, when = 0, vol = 0.06): void {
  const { sound, style } = useSettings.getState()
  if (!sound) return
  try {
    ac ??= new AudioContext()
    const o = ac.createOscillator()
    const g = ac.createGain()
    const t = ac.currentTime + when
    o.type = style === 'pixel' ? 'square' : 'triangle'
    o.frequency.value = freq
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(ac.destination)
    o.start(t)
    o.stop(t + dur)
  } catch {
    // No audio here (or it is blocked): the game stays silent.
  }
}

const SOUNDS: Record<Sound, () => void> = {
  tap: () => tone(520, 0.05),
  open: () => tone(660, 0.06),
  ok: () => {
    tone(587, 0.1)
    tone(784, 0.18, 0.08)
  },
  good: () => {
    tone(660, 0.1)
    tone(880, 0.12, 0.08)
    tone(1320, 0.25, 0.16)
  },
  bad: () => {
    tone(180, 0.25)
    tone(130, 0.32, 0.1)
  },
  age: () => [392, 523, 659, 784].forEach((f, i) => tone(f, 0.2, i * 0.09)),
}

export function play(sound: Sound): void {
  SOUNDS[sound]()
}

/** What a result sounds like. */
export const RESULT_SOUND: Record<ResultTier, Sound> = { great: 'good', good: 'ok', weak: 'tap', fail: 'bad' }
