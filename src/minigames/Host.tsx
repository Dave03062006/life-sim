import { type PointerEvent, useEffect, useRef, useState } from 'react'
import { RESULT_SOUND, play } from '../app/sound'
import { useApp } from '../app/store'
import type { ActivityDef, ResultTier } from '../content/types'
import { gameClock } from '../engine/clock'
import { randomSeed } from '../engine/random'
import { useSettings } from '../engine/settings'
import { SKIP_SCORE } from '../life/activities'
import { Changes } from '../ui/Changes'
import { useReducedMotion } from '../ui/useReducedMotion'
import { type GameInput, type GameKey, type Modifiers, STEP } from './framework'
import { rulesFor } from './index'
import { THEMES, wordFor } from './themes'
import { TimingView } from './timing/View'

const KEYS: Partial<Record<string, GameKey>> = {
  Space: 'primary',
  Enter: 'primary',
  NumpadEnter: 'primary',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
}
/** Where the futsal ball ends up for each result, in % of the scene (from the mockup). */
const BALL_TO: Record<ResultTier, [number, number]> = { great: [63, 33], good: [39, 43], weak: [50, 47], fail: [90, 12] }
const FLIGHT_MS = 430
const LAND_FALLBACK_MS = 900
const HITS: readonly ResultTier[] = ['great', 'good']
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

/** The mini-game being played, over the year screen, and its result once it lands. */
export function MinigameHost() {
  const playing = useApp((s) => s.playing)
  return playing ? <Game def={playing.def} mods={playing.mods} /> : null
}

function Game({ def, mods }: { def: ActivityDef; mods: Modifiers }) {
  const { type, theme } = def.minigame! // only activities with a mini-game are played
  const [rules] = useState(() => rulesFor(type))
  // the running game lives outside React state: the clock steps it, React only draws its view
  const [initial] = useState(() => ({ state: rules.start(mods, randomSeed()), acc: 0, inputs: [] as GameInput[], over: false }))
  const game = useRef(initial)
  const [view, setView] = useState(() => rules.view(initial.state))
  const [skipped, setSkipped] = useState(false)
  const [landed, setLanded] = useState(false)
  const result = useApp((s) => s.lastResult)
  const closeResult = useApp((s) => s.closeResult)
  const reduced = useReducedMotion()
  const modal = useRef<HTMLDivElement>(null)
  const ball = useRef<HTMLElement>(null)
  const back = useRef<HTMLButtonElement>(null)
  const { ball: hasBall, verb = 'Stop' } = THEMES[theme] ?? {}

  useEffect(() => {
    if (!gameClock.running) gameClock.start()
    return gameClock.subscribe(({ dt }) => {
      if (game.current.over) return
      game.current.acc += dt
      let stepped = false
      while (game.current.acc >= STEP && !game.current.over) {
        game.current.acc -= STEP
        game.current.state = rules.step(game.current.state, game.current.inputs)
        game.current.inputs = []
        game.current.over = rules.done(game.current.state)
        stepped = true
      }
      if (stepped) setView(rules.view(game.current.state))
      if (game.current.over) useApp.getState().finish(rules.score(game.current.state))
    })
  }, [game, rules])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = KEYS[e.code]
      // a focused button (Skip, Back) answers its own keys
      if (!key || game.current.over || e.target instanceof HTMLButtonElement) return
      e.preventDefault()
      if (!e.repeat) game.current.inputs.push({ kind: 'key', key, down: e.type === 'keydown' })
    }
    const pause = () => gameClock.pause()
    const resume = () => gameClock.resume()
    addEventListener('keydown', onKey)
    addEventListener('keyup', onKey)
    addEventListener('blur', pause)
    addEventListener('focus', resume)
    return () => {
      removeEventListener('keydown', onKey)
      removeEventListener('keyup', onKey)
      removeEventListener('blur', pause)
      removeEventListener('focus', resume)
      gameClock.resume() // never leave the clock paused behind us
    }
  }, [game])

  useEffect(() => modal.current?.focus(), [])

  // The result lands when the ball does; the timer covers a tab that draws no frames.
  useEffect(() => {
    if (!result) return
    const el = ball.current
    if (skipped || reduced || !el?.animate) {
      setLanded(true)
      return
    }
    const [left, top] = BALL_TO[result.tier]
    const flight = el.animate([{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%,-50%) scale(.42)' }], {
      duration: FLIGHT_MS,
      easing: useSettings.getState().style === 'pixel' ? 'steps(7,end)' : 'cubic-bezier(.15,.6,.3,1)',
      fill: 'forwards',
    })
    const land = () => setLanded(true)
    flight.onfinish = land
    const timer = setTimeout(land, LAND_FALLBACK_MS)
    return () => {
      flight.onfinish = null
      clearTimeout(timer)
    }
  }, [result, skipped, reduced])

  useEffect(() => {
    if (!landed || !result) return
    play(RESULT_SOUND[result.tier])
    back.current?.focus()
  }, [landed, result])

  const press = () => {
    game.current.inputs.push({ kind: 'key', key: 'primary', down: true }, { kind: 'key', key: 'primary', down: false })
  }
  const pointer = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = r.width ? clamp01((e.clientX - r.left) / r.width) : 0
    const y = r.height ? clamp01((e.clientY - r.top) / r.height) : 0
    game.current.inputs.push({ kind: 'pointer', phase: 'down', x, y })
  }
  const skip = () => {
    game.current.over = true
    setSkipped(true)
    useApp.getState().finish(SKIP_SCORE)
  }

  const shown = landed && result
  const hit = shown && HITS.includes(result.tier)
  const effects = shown && !skipped && !reduced
  return (
    <div className="veil">
      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the mockup's veil and card, not the browser's dialog styling */}
      <div role="dialog" aria-modal="true" aria-labelledby="game-title" ref={modal} tabIndex={-1} className={['card modal game', effects && (hit ? 'hit' : 'miss')].filter(Boolean).join(' ')}>
        <span className="label">Mini-game · {type}</span>
        <h2 id="game-title">{def.title}</h2>
        <p>Stop the marker in the green to score. The gold centre is best.</p>
        <div onPointerDown={shown || skipped ? undefined : pointer}>
          <TimingView view={view} category={def.category} effects={effects && hit ? 'flash zoom' : undefined}>
            {hasBall && <i className="ball" ref={ball} />}
            {shown && !skipped && <div className={reduced ? 'shout shown' : 'shout on'}>{wordFor(theme, result.tier)}</div>}
          </TimingView>
        </div>
        <div className="mf">
          <div className="res" aria-live="polite">
            {shown && (
              <>
                {result.entry.text}
                <Changes changes={result.entry.changes} />
              </>
            )}
          </div>
          {shown ? (
            <button className="primary" ref={back} onClick={closeResult}>
              Back to your year
            </button>
          ) : (
            !result && (
              <>
                <button className="ghost" onClick={skip}>
                  Skip for a weaker result
                </button>
                <button className="primary" onClick={press}>
                  {verb}
                  <kbd>Space</kbd>
                </button>
              </>
            )
          )}
        </div>
      </div>
    </div>
  )
}
