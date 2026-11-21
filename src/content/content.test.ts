import { describe, expect, it } from 'vitest'
import { stageOf } from '../life/stages'
import { hasIcon } from '../styles/art'
import { GAMES } from '../minigames/registry'
import { THEMES } from '../minigames/themes'
import { packFor } from './index'

const pack = packFor('indonesia')
const lateTeen = pack.activities.filter((a) => a.stages.includes('late-teen'))

describe('indonesia content', () => {
  it('offers 46 late-teen activities, at least four in every category', () => {
    expect(lateTeen).toHaveLength(46)
    for (const c of stageOf(16).categories) {
      expect({ c, ok: lateTeen.filter((a) => a.category === c).length >= 4 }).toEqual({ c, ok: true })
    }
  })
  it('gives every activity what the screen and the rules need', () => {
    expect(new Set(pack.activities.map((a) => a.id)).size).toBe(pack.activities.length)
    for (const a of pack.activities) {
      const linesSize = typeof a.lines === 'string' ? a.lines.length : Object.keys(a.lines).length
      expect({ id: a.id, ok: a.title.length > 2 }).toEqual({ id: a.id, ok: true })
      expect({ id: a.id, ok: a.description.length > 9 }).toEqual({ id: a.id, ok: true })
      expect({ id: a.id, ok: hasIcon(a.icon) }).toEqual({ id: a.id, ok: true })
      expect({ id: a.id, ok: linesSize > 3 }).toEqual({ id: a.id, ok: true })
      for (const r of a.requires ?? []) expect({ id: a.id, ok: r.reason.length > 9 }).toEqual({ id: a.id, ok: true })
      expect({ id: a.id, ok: !a.rest || a.energy === 0 }).toEqual({ id: a.id, ok: true })
      expect({ id: a.id, ok: !a.minigame || Object.keys(a.failPenalty ?? {}).length > 0 }).toEqual({ id: a.id, ok: true })
    }
  })
  it('gives every mini-game activity a game that is built', () => {
    for (const a of pack.activities.filter((x) => x.minigame)) {
      const type = a.minigame!.type
      expect({ id: a.id, built: GAMES[type].rules.type }).toEqual({ id: a.id, built: type })
    }
  })
  it('gives every quiz activity a question source', () => {
    for (const a of pack.activities.filter((x) => x.minigame?.type === 'quiz')) {
      expect({ id: a.id, has: !!THEMES[a.id]?.quiz }).toEqual({ id: a.id, has: true })
    }
  })
  it('marks the milestone at 17', () => {
    expect(pack.milestones[17]).toContain('KTP')
  })
})

describe('indonesia events', () => {
  const events = pack.events
  const lt = events.filter((e) => e.stages.includes('late-teen'))
  const choices = events.filter((e) => e.kind === 'choice')
  const actions = choices.flatMap((e) => (e.actions ?? []).map((a) => ({ e, a })))
  const outcomes = actions.flatMap(({ e, a }) => (['success', 'mixed', 'fail'] as const).map((t) => ({ e, a, t, o: a.outcomes[t] })))
  const roles = (e: (typeof events)[number]) => ['name', 'them', ...Object.keys(e.cast ?? {})]
  const texts = (e: (typeof events)[number]) => [e.title, e.text, e.recall?.text ?? '', e.news?.text ?? '',
    ...(e.actions ?? []).flatMap((a) => [a.label, a.open?.note ?? '', ...Object.values(a.outcomes).flatMap((o) => [o.text, o.memory?.text ?? ''])])]
  const unknownRoles = events.flatMap((e) => texts(e).flatMap((t) => [...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!)).filter((r) => !roles(e).includes(r)))
  const recorded = new Set(outcomes.flatMap(({ o }) => (o.memory ? [o.memory.id] : [])))
  const wanted = events.flatMap((e) => [
    ...(e.when ?? []).flatMap((c) => (c.kind === 'memory' || c.kind === 'no-memory' ? [c.id] : [])),
    ...(e.recall ? [e.recall.memory] : []),
    ...(e.actions ?? []).flatMap((a) => (a.open?.condition.kind === 'memory' ? [a.open.condition.id] : [])),
  ])
  it('has enough late-teen events', () => {
    expect(lt.filter((e) => e.kind === 'choice').length).toBeGreaterThanOrEqual(14)
    expect(lt.filter((e) => e.kind === 'news').length).toBeGreaterThanOrEqual(8)
    expect(new Set(events.map((e) => e.id)).size).toBe(events.length)
  })
  it('builds every choice event with 2-5 actions and three written outcomes each', () => {
    expect(choices.filter((e) => (e.actions?.length ?? 0) < 2 || (e.actions?.length ?? 0) > 5)).toEqual([])
    expect(outcomes.filter(({ o }) => o.text.length < 5)).toEqual([])
    expect(actions.filter(({ a }) => a.label.length < 3)).toEqual([])
    expect(actions.filter(({ a }) => a.chance < 30 || a.chance > 85)).toEqual([])
    expect(actions.filter(({ a }) => a.open && a.open.note.length < 5)).toEqual([])
  })
  it('keeps at least two actions open to a player who answered "Nobody yet"', () => {
    expect(choices.filter((e) => (e.actions ?? []).filter((a) => !a.romance).length < 2)).toEqual([])
  })
  it('only uses placeholders for roles in the cast', () => {
    expect(unknownRoles).toEqual([])
  })
  it('records every memory that a condition, open or recall needs', () => {
    expect(wanted.filter((id) => !recorded.has(id))).toEqual([])
    expect(recorded.has('covered-friend')).toBe(true)
  })
  it('keeps effects modest', () => {
    const big = outcomes.filter(({ o }) => Object.values(o.effects ?? {}).some((v) => Math.abs(v) > 8) || Math.abs(o.money ?? 0) > 500_000 || (o.money !== undefined && o.money !== 0 && Math.abs(o.money) < 10_000))
    expect(big).toEqual([])
    expect(events.filter((e) => e.news && (Object.values(e.news.effects ?? {}).some((v) => Math.abs(v) > 8) || Math.abs(e.news.money ?? 0) > 500_000))).toEqual([])
  })
  it('limits crush events to late teens and rare draws, and adds crushes only in romance actions', () => {
    expect(events.filter((e) => Object.values(e.cast ?? {}).includes('crush') && (!e.stages.includes('late-teen') || e.weight > 2))).toEqual([])
    expect(outcomes.filter(({ a, o }) => o.addPerson && !a.romance)).toEqual([])
    expect(outcomes.filter(({ o }) => o.addPerson)).not.toHaveLength(0)
  })
  it('includes the required story events and news', () => {
    const trip = events.find((e) => e.id === 'class-trip-money')!
    expect(trip.actions!.map((a) => a.id)).toEqual(['defend', 'stay-out', 'tell-teacher', 'speak', 'remind'])
    expect(trip.actions!.find((a) => a.id === 'remind')!.open!.note).toBe('Open to you: your choice at 15')
    expect(events.filter((e) => e.recall?.memory === 'covered-friend')).not.toHaveLength(0)
    const newsEvents = events.filter((e) => e.kind === 'news')
    expect(newsEvents.filter((e) => (e.news?.money ?? 0) !== 0)).not.toHaveLength(0)
    expect(newsEvents.filter((e) => (e.news?.effects?.health ?? 0) !== 0)).not.toHaveLength(0)
  })
  it('defines talk and ask-out for use from 12', () => {
    const built = events.filter((e) => e.id === 'talk' || e.id === 'ask-out')
    expect(built.map((e) => e.id)).toEqual(['talk', 'ask-out'])
    expect(built.filter((e) => !e.stages.includes('early-teen') || e.weight !== 0 || e.actions!.length !== 3)).toEqual([])
  })
})
