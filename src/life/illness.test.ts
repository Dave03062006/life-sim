import { afterEach, describe, expect, it } from 'vitest'
import { packFor } from '../content'
import type { ContentPack, IllnessDef } from '../content/types'
import { createRng } from '../engine/random'
import { finishActivity } from './activities'
import { applySymptoms, catchIllnesses, discover, illnessEffects, illnessEnergy, onsetChance } from './illness'
import { testLife } from './testLife'
import type { Illness, Life } from './types'
import { openYear } from './year'

const base: IllnessDef = {
  id: 'flu', name: 'Flu', kind: 'short', onset: [[40, 0.2], [0, 0.1]], symptoms: '', stages: [{ death: 0, symptoms: { health: -5, happiness: -3 } }],
  treated: { die: 0 }, treatments: [], sources: [],
}
const quiet: IllnessDef = { ...base, id: 'sugar', name: 'Type 2 diabetes', kind: 'long', stages: [{ death: 0, silent: true }, { death: 0, symptoms: { health: -2 } }] }
const packOf = (illnesses: IllnessDef[]): ContentPack => ({ id: 'indonesia', activities: [], milestones: {}, events: [], careers: [], belongings: [], illnesses })
const ill = (id: string, more: Partial<Illness> = {}): Illness => ({ id, since: 10, stage: 0, known: true, treated: null, ...more })
const real = packFor('indonesia')

describe('onsetChance', () => {
  it('uses the age band and respects gender and an existing illness', () => {
    expect(onsetChance(testLife({ age: 16 }), base)).toBe(0.1)
    expect(onsetChance(testLife({ age: 50 }), base)).toBe(0.2)
    expect(onsetChance(testLife({ age: 50 }), { ...base, gender: 'female' })).toBe(0)
    expect(onsetChance(testLife({ age: 50, gender: 'female' }), { ...base, gender: 'female' })).toBe(0.2)
    expect(onsetChance(testLife({ age: 50, illnesses: [ill('flu')] }), base)).toBe(0)
  })
  it('multiplies for low Health and high Stress, halves with the vaccine, and caps at 1', () => {
    const risky = { ...base, risk: { lowHealth: 2, highStress: 1.5, untreated: { sugar: 3 } } }
    const sick = testLife({ age: 50, stats: { ...testLife().stats, health: 20, stress: 80 } })
    expect(onsetChance(sick, risky)).toBeCloseTo(0.6)
    expect(onsetChance(testLife({ age: 50, illnesses: [ill('sugar')] }), risky)).toBeCloseTo(0.6)
    expect(onsetChance(testLife({ age: 50, flags: ['vaccinated'] }), { ...base, vaccine: 'vaccinated' })).toBeCloseTo(0.1)
    expect(onsetChance(testLife({ age: 50 }), { ...base, onset: [[0, 5]] })).toBe(1)
  })
})

describe('catching and finding', () => {
  it('starts a plain illness at stage 0 with a journal line', () => {
    const life = catchIllnesses(testLife(), packOf([{ ...base, onset: [[0, 1]] }]), createRng(1))
    expect(life.illnesses).toEqual([{ id: 'flu', since: 16, stage: 0, known: true, treated: null }])
    expect(life.journal.map((e) => e.text)).toEqual(['You came down with flu.'])
  })
  it('keeps a silent illness hidden and quiet, until a check-up or its symptoms reveal it', () => {
    const pack = packOf([{ ...quiet, onset: [[0, 1]] }])
    const caught = catchIllnesses(testLife(), pack, createRng(1))
    expect(caught.illnesses[0]?.known).toBe(false)
    expect(caught.journal).toEqual([])
    expect(discover(caught, pack, 'symptoms')).toBe(caught)
    expect(discover(caught, pack, 'check-up').journal.map((e) => e.text)).toEqual(['Your check-up found type 2 diabetes. It had been there quietly.'])
    const later = { ...caught, illnesses: [{ ...caught.illnesses[0]!, stage: 1 }] }
    const found = discover(later, pack, 'symptoms')
    expect(found.illnesses[0]?.known).toBe(true)
    expect(found.journal.map((e) => e.text)).toEqual(['You had been feeling unwell for a while. A doctor said it was type 2 diabetes.'])
  })
  it('applies symptoms once, as one journal entry, only for untreated illnesses', () => {
    const pack = packOf([base, quiet])
    const life = applySymptoms(testLife({ illnesses: [ill('flu'), ill('sugar', { known: false })] }), pack)
    expect(life.stats.health).toBe(53)
    expect(life.stats.happiness).toBe(68)
    expect(life.journal).toHaveLength(1)
    expect(life.journal[0]?.changes).toEqual([{ key: 'health', delta: -5 }, { key: 'happiness', delta: -3 }])
    expect(applySymptoms(testLife({ illnesses: [ill('flu', { treated: 'eased' })] }), pack).journal).toEqual([])
  })
  it('lists effect labels only for known, untreated illnesses, and totals energy', () => {
    const shaky = { ...base, minigame: { label: 'Shaky hands', mods: { wobble: 1 } } }
    expect(illnessEffects(testLife({ illnesses: [ill('flu')] }), packOf([shaky]))).toEqual(['Shaky hands'])
    expect(illnessEffects(testLife({ illnesses: [ill('flu', { treated: 'controlled' })] }), packOf([shaky]))).toEqual([])
    expect(illnessEnergy(testLife({ illnesses: [ill('flu')] }), packOf([{ ...base, stages: [{ death: 0, energy: 2 }] }]))).toBe(2)
  })
})

describe('with the year and the check-up', () => {
  afterEach(() => { real.illnesses.length = 0 })
  it('resets treatment, catches, applies symptoms and reveals by symptoms when a year opens', () => {
    real.illnesses.push({ ...base, onset: [[0, 0]] }, { ...quiet, onset: [[0, 0]], stages: [{ death: 0, silent: true }, { death: 0 }] })
    const life = testLife({ age: 30, illnesses: [ill('flu', { treated: 'cured' }), ill('sugar', { known: false, stage: 1 })] })
    const next: Life = openYear(life, real)
    expect(next.illnesses.map((i) => [i.id, i.treated, i.known])).toEqual([['flu', null, true], ['sugar', null, true]])
    expect(next.journal.map((e) => e.text)).toEqual([
      'Being unwell took its toll this year.',
      'You had been feeling unwell for a while. A doctor said it was type 2 diabetes.',
    ])
  })
  it('lets a Good check-up find a hidden illness in place of the nothing-new line', () => {
    real.illnesses.push(quiet)
    const checkup = real.activities.find((a) => a.id === 'checkup')!
    const life = testLife({ money: 100000, illnesses: [ill('sugar', { known: false })] })
    const out = finishActivity(life, checkup, 0.7)
    expect(out.entry.text).toBe('Your check-up found type 2 diabetes. It had been there quietly.')
    expect(out.life.illnesses[0]?.known).toBe(true)
    expect(finishActivity(testLife({ money: 100000 }), checkup, 0.7).entry.text).toBe('Your check-up found nothing new.')
    expect(finishActivity(life, checkup, 0.1).life.illnesses[0]?.known).toBe(false)
  })
  it('sets the vaccinated flag from a Good immunisation', () => {
    const shots = real.activities.find((a) => a.id === 'immunisation')!
    expect(finishActivity(testLife({ age: 3 }), shots, 0.7).life.flags).toContain('vaccinated')
  })
})
