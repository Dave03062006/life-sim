import { afterEach, describe, expect, it } from 'vitest'
import { packFor } from '../content'
import type { ContentPack, IllnessDef, TreatmentDef } from '../content/types'
import { offersFor } from './activities'
import { testLife } from './testLife'
import { treat, treatmentCost, treatmentOffers } from './treatment'
import type { Illness } from './types'

const surgery: TreatmentDef = { id: 'surgery', label: 'Surgery', place: 'hospital', cost: 15_000_000, energy: 2, effect: 'cure', stages: [0] }
const pills: TreatmentDef = { id: 'pills', label: 'Pills', place: 'puskesmas', cost: 100_000, energy: 1, effect: 'control' }
const rest: TreatmentDef = { id: 'rest', label: 'Rest', place: 'home', cost: 0, energy: 0, effect: 'ease' }
const flu: IllnessDef = {
  id: 'test-flu', name: 'Flu', kind: 'short', onset: [[0, 0]], symptoms: '', stages: [{ death: 0, symptoms: { health: -5 } }, { death: 0 }],
  treated: { die: 0 }, treatments: [surgery, pills, rest], sources: [],
}
const pack: ContentPack = { id: 'indonesia', activities: [], milestones: {}, events: [], careers: [], belongings: [], illnesses: [flu] }
const ill = (more: Partial<Illness> = {}): Illness => ({ id: 'test-flu', since: 10, stage: 0, known: true, treated: null, ...more })
const adult = (more = {}) => testLife({ age: 30, money: 20_000_000, illnesses: [ill()], ...more })
const real = packFor('indonesia')
const saved = [...real.illnesses]

describe('treatment offers', () => {
  it('is free for a child, and says the family pays', () => {
    const [o] = treatmentOffers(testLife({ age: 9, money: 0, illnesses: [ill()] }), pack)
    expect(treatmentCost(testLife({ age: 9 }), surgery)).toBe(0)
    expect(o?.def.id).toBe('treat:test-flu:surgery')
    expect(o?.def.description).toBe('Your family pays.')
    expect(o?.blocked).toBeNull()
  })
  it('is free with BPJS, and says so', () => {
    const life = adult({ money: 0, flags: ['bpjs'] })
    expect(treatmentCost(life, surgery)).toBe(0)
    expect(treatmentOffers(life, pack)[0]?.def.description).toBe('BPJS covers it.')
    expect(treatmentOffers(life, pack)[0]?.blocked).toBeNull()
  })
  it('blocks an adult without BPJS and without the money, with the exact reason', () => {
    const o = treatmentOffers(adult({ money: 2_000_000 }), pack)[0]
    expect(o?.blocked).toBe('You need Rp 15.000.000. You have Rp 2.000.000. BPJS would cover it.')
    expect(treatmentOffers(adult(), pack)[0]?.def.description).toBe('Rp 15.000.000')
  })
  it('offers nothing for a hidden illness, and nothing for a cured one', () => {
    expect(treatmentOffers(adult({ illnesses: [ill({ known: false })] }), pack)).toEqual([])
    expect(treatmentOffers(adult({ illnesses: [ill({ treated: 'cured' })] }), pack)).toEqual([])
  })
  it('stays open when the treatment is free and money is negative', () => {
    expect(treatmentOffers(testLife({ age: 9, money: -500, illnesses: [ill()] }), pack)[0]?.blocked).toBeNull()
    expect(treatmentOffers(adult({ money: -500, flags: ['bpjs'] }), pack)[0]?.blocked).toBeNull()
    expect(treatmentOffers(adult({ money: -500 }), pack).find((o) => o.def.id.endsWith('rest'))?.blocked).toBeNull()
    expect(treat(adult({ money: -500 }), 'test-flu', 'rest', pack).life.illnesses[0]?.treated).toBe('eased')
  })
  it('blocks a treatment that does not fit the stage', () => {
    const late = treatmentOffers(adult({ illnesses: [ill({ stage: 1 })] }), pack)
    expect(late.find((o) => o.def.id.endsWith('surgery'))?.blocked).toBe('Found too late for surgery.')
    const noStages = { ...flu, treatments: [{ ...pills, stages: [0] }] }
    expect(treatmentOffers(adult({ illnesses: [ill({ stage: 1 })] }), { ...pack, illnesses: [noStages] })[0]?.blocked).toBe('Not at this stage.')
  })
  it('shows a controlled treatment as done, and hides a used one', () => {
    const life = adult()
    const { life: after } = treat(life, 'test-flu', 'pills', pack)
    const again = treatmentOffers(after, pack)
    expect(again.find((o) => o.def.id.endsWith('pills'))?.blocked).toBe('Controlled this year. Take it again next year.')
    expect(again.find((o) => o.def.id.endsWith('rest'))?.timesDone).toBe(0)
    const eased = treat(life, 'test-flu', 'rest', pack).life
    expect(treatmentOffers(eased, pack).some((o) => o.def.id.endsWith('rest'))).toBe(false)
  })
})

describe('treating', () => {
  it('cure removes the illness and charges the price and energy', () => {
    const { life, entry } = treat(adult(), 'test-flu', 'surgery', pack)
    expect(life.illnesses).toEqual([])
    expect(life.money).toBe(5_000_000)
    expect(life.energySpent).toBe(2)
    expect(entry.text).toBe('You were treated for flu and got better.')
  })
  it('control marks the illness controlled for this year', () => {
    const { life, entry } = treat(adult(), 'test-flu', 'pills', pack)
    expect(life.illnesses[0]?.treated).toBe('controlled')
    expect(entry.text).toBe('You kept flu under control this year.')
  })
  it('ease stops symptoms but the illness stays', () => {
    const { life } = treat(adult(), 'test-flu', 'rest', pack)
    expect(life.illnesses[0]?.treated).toBe('eased')
  })
  it('uses the treatment line when it has one', () => {
    const custom = { ...flu, treatments: [{ ...surgery, line: 'You had it out.' }] }
    expect(treat(adult(), 'test-flu', 'surgery', { ...pack, illnesses: [custom] }).entry.text).toBe('You had it out.')
  })
  it('refuses a blocked treatment', () => {
    expect(() => treat(adult({ money: 0 }), 'test-flu', 'surgery', pack)).toThrow(/blocked/)
  })
})

describe('in the Health category', () => {
  afterEach(() => { real.illnesses.splice(0, real.illnesses.length, ...saved) })
  it('lists treatments before the ordinary activities', () => {
    real.illnesses.push(flu)
    const offers = offersFor(adult(), 'health', real)
    expect(offers[0]?.def.id).toBe('treat:test-flu:surgery')
    expect(offers.some((o) => o.def.id === 'checkup')).toBe(true)
  })
})
