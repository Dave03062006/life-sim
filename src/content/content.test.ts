import { describe, expect, it } from 'vitest'
import { STAGES, stageOf } from '../life/stages'
import { eventArt, hasIcon } from '../styles/art'
import { GAMES } from '../minigames/registry'
import { THEMES } from '../minigames/themes'
import { questionsFor } from '../minigames/quiz/questions'
import { wider } from './countries/indonesia/activities'
import { packFor } from './index'

const pack = packFor('indonesia')
const lateTeen = pack.activities.filter((a) => a.stages.includes('late-teen'))

describe('indonesia content', () => {
  it('defines the SMP fork and the entrance test', () => {
    const fork = pack.events.find((e) => e.id === 'after-smp')!
    expect(fork.weight).toBe(0)
    expect(fork.actions!.map((a) => a.label)).toEqual(['Go on to SMA', 'Go on to SMK', 'Start working'])
    const paths = fork.actions!.map((a) => [...new Set(Object.values(a.outcomes).map((o) => o.path))])
    expect(paths).toEqual([['sma'], ['smk'], ['leave-school']])
    const test = pack.activities.find((a) => a.id === 'entrance-test')!
    expect(test).toMatchObject({ sets: 'passed-entrance', energy: 3, minigame: { type: 'quiz', theme: 'entrance-test' } })
    expect(THEMES['entrance-test']?.count).toBe(10)
    expect(questionsFor(THEMES['entrance-test']!.quiz!, 1, 10)).toHaveLength(10)
  })
  it('offers 51 late-teen activities, at least four in every category', () => {
    expect(lateTeen).toHaveLength(51)
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
      expect({ id: a.id, ok: hasIcon(a.icon) || hasIcon(`cat-${a.category}`) }).toEqual({ id: a.id, ok: true })
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
  it('offers at least two activities in every category each stage opens', () => {
    for (const s of STAGES) {
      for (const c of s.categories) {
        const n = pack.activities.filter((a) => a.category === c && a.stages.includes(s.id)).length
        expect({ stage: s.id, c, ok: n >= 2 }).toEqual({ stage: s.id, c, ok: true })
      }
    }
  })
  it('never offers an activity in a category its stage does not open', () => {
    for (const s of STAGES) {
      expect(pack.activities.filter((a) => a.stages.includes(s.id) && !s.categories.includes(a.category)).map((a) => a.id)).toEqual([])
    }
  })
  it('widens only activities that exist, and keeps crawl and first words for age 1 and up', () => {
    expect(Object.keys(wider).filter((id) => !pack.activities.some((a) => a.id === id))).toEqual([])
    for (const id of ['crawl', 'first-words']) {
      expect(pack.activities.find((a) => a.id === id)!.requires).toEqual([{ kind: 'min-age', age: 1, reason: 'From age 1.' }])
    }
  })
  it('writes milestone lines for the key ages', () => {
    for (const age of [0, 1, 4, 6, 12, 15, 17, 18, 40, 60]) expect({ age, ok: (pack.milestones[age] ?? '').length > 9 }).toEqual({ age, ok: true })
  })
  it('gives child and early-teen quizzes only primary and junior questions, enough to draw five', () => {
    const young = pack.activities.filter((a) => a.minigame?.type === 'quiz' && (a.stages.includes('child') || a.stages.includes('early-teen')))
    for (const a of young) {
      const qs = questionsFor(THEMES[a.id]!.quiz!, 1, 99)
      expect({ id: a.id, ok: qs.length >= 5 && qs.every((q) => q.level !== 'sma') }).toEqual({ id: a.id, ok: true })
    }
    expect(young.map((a) => a.id)).toContain('class-test')
  })
})

describe('indonesia events', () => {
  const events = pack.events
  const lt = events.filter((e) => e.stages.includes('late-teen'))
  const choices = events.filter((e) => e.kind === 'choice')
  const actions = choices.flatMap((e) => (e.actions ?? []).map((a) => ({ e, a })))
  const outcomes = actions.flatMap(({ e, a }) => (['success', 'mixed', 'fail'] as const).map((t) => ({ e, a, t, o: a.outcomes[t] })))
  const BUILT_IN = ['talk', 'ask-out', 'propose', 'wedding']
  const roles = (e: (typeof events)[number]) => ['name', ...(BUILT_IN.includes(e.id) ? ['them'] : []), 'job', 'next', ...Object.keys(e.cast ?? {}), ...(e.id.startsWith('baby-talk') ? ['child'] : [])]
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
  it('gives every stage two news events, and every stage from early teen two choice events', () => {
    for (const s of STAGES) {
      const here = events.filter((e) => e.stages.includes(s.id) && e.weight > 0)
      expect({ s: s.id, n: here.filter((e) => e.kind === 'news').length >= 2 }).toEqual({ s: s.id, n: true })
      const needed = s.from >= 12 ? 2 : 0
      expect({ s: s.id, n: here.filter((e) => e.kind === 'choice').length >= needed }).toEqual({ s: s.id, n: true })
    }
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
    const big = outcomes.filter(({ e }) => e.id !== 'wedding').filter(({ o }) => Object.values(o.effects ?? {}).some((v) => Math.abs(v) > 8) || Math.abs(o.money ?? 0) > 500_000 || (o.money !== undefined && o.money !== 0 && Math.abs(o.money) < 10_000))
    expect(big).toEqual([])
    expect(events.filter((e) => e.news && (Object.values(e.news.effects ?? {}).some((v) => Math.abs(v) > 8) || Math.abs(e.news.money ?? 0) > 500_000))).toEqual([])
  })
  it('limits crush events to late teens and rare draws, and adds crushes only in romance actions', () => {
    expect(events.filter((e) => Object.values(e.cast ?? {}).includes('crush') && (!e.stages.includes('late-teen') || e.weight > 2))).toEqual([])
    expect(outcomes.filter(({ a, o }) => o.addPerson?.relation === 'crush' && !a.romance)).toEqual([])
    expect(outcomes.filter(({ o }) => o.addPerson?.relation === 'crush')).not.toHaveLength(0)
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
  it('uses only banners that exist, and gates the story events by age', () => {
    expect(events.filter((e) => e.art && !eventArt(e.art))).toEqual([])
    expect(eventArt(events.find((e) => e.id === 'class-trip-money')!.art ?? 'class-trip-money')).not.toBeNull()
    expect(events.find((e) => e.id === 'cover-for-friend')!.when).toContainEqual({ kind: 'age', min: 15, max: 15 })
    expect(events.find((e) => e.id === 'class-trip-money')!.when).toContainEqual({ kind: 'age', min: 16 })
  })
  it('uses {them} only in built-in person events and events that cast it', () => {
    expect(events.filter((e) => !BUILT_IN.includes(e.id) && !e.cast?.them && texts(e).some((t) => t.includes('{them}')))).toEqual([])
  })
  it('limits every repeat event with a children or no-memory condition', () => {
    const repeats = events.filter((e) => e.repeat)
    expect(repeats.map((e) => e.id)).toContain('baby-talk')
    expect(repeats.filter((e) => !(e.when ?? []).some((c) => c.kind === 'children' || c.kind === 'no-memory'))).toEqual([])
  })
  it('writes the child events so they read right for a grown child', () => {
    const kids = events.filter((e) => e.cast?.child === 'child' && e.id.startsWith('child-'))
    expect(kids).toHaveLength(2)
    expect(kids.filter((e) => /sleep|bedtime|story|lullaby|coop|toddler|baby/i.test(texts(e).join(' ')))).toEqual([])
  })
  it('offers three wedding choices with the right prices', () => {
    const wedding = events.find((e) => e.id === 'wedding')!
    expect(wedding.weight).toBe(0)
    expect(wedding.actions!.map((a) => a.outcomes.success.money)).toEqual([-15_000_000, -80_000_000, 0])
    expect(events.find((e) => e.id === 'propose')!.weight).toBe(0)
  })
  it('defines talk and ask-out for use from 12', () => {
    const built = events.filter((e) => e.id === 'talk' || e.id === 'ask-out')
    expect(built.map((e) => e.id)).toEqual(['talk', 'ask-out'])
    expect(built.filter((e) => !e.stages.includes('early-teen') || e.weight !== 0 || e.actions!.length !== 3)).toEqual([])
  })
})

describe('indonesia careers', () => {
  it('has eight ladders of rising pay, each requirement with a reason', () => {
    expect(pack.careers.map((c) => c.id)).toEqual(['shop', 'office', 'teaching', 'nursing', 'software', 'driving', 'civil', 'business'])
    for (const c of pack.careers) {
      expect({ id: c.id, ok: c.steps.length >= 3 && c.steps.length <= 4 }).toEqual({ id: c.id, ok: true })
      expect({ id: c.id, rising: c.steps.every((s, i) => i === 0 || s.salary > c.steps[i - 1]!.salary) }).toEqual({ id: c.id, rising: true })
      for (const s of c.steps) for (const r of s.requires ?? []) expect({ id: c.id, ok: r.reason.length > 9 }).toEqual({ id: c.id, ok: true })
    }
  })
  it('asks for Reputation 60 at the top of every ladder but business', () => {
    for (const c of pack.careers) {
      const top = c.steps.at(-1)!.requires ?? []
      expect({ id: c.id, rep: top.some((r) => r.kind === 'stat' && r.key === 'reputation' && r.min === 60) }).toEqual({ id: c.id, rep: !c.business })
    }
  })
  it('defines six work activities and a promotion event', () => {
    expect(pack.activities.filter((a) => a.track === 'work').map((a) => a.id)).toEqual(['extra-hours', 'help-colleague', 'pitch-idea', 'clear-inbox', 'team-lunch', 'slack-off'])
    const promotion = pack.events.find((e) => e.id === 'promotion')!
    expect(promotion.weight).toBe(0)
    expect(promotion.actions!.map((a) => a.label)).toEqual(['Accept', 'Ask for a bigger raise', 'Turn it down'])
  })
  it('names a belonging for every purchase, and never resells above the price', () => {
    for (const a of pack.activities.filter((x) => x.buys)) expect({ id: a.id, ok: pack.belongings.some((b) => b.id === a.buys) }).toEqual({ id: a.id, ok: true })
    for (const b of pack.belongings) expect({ id: b.id, ok: b.resale <= b.price }).toEqual({ id: b.id, ok: true })
  })
})
