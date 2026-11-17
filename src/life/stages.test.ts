import { describe, expect, it } from 'vitest'
import { STAGES, stageOf } from './stages'

describe('stages', () => {
  it('gives each age its stage and energy', () => {
    expect([0, 2, 3, 5, 6, 11, 12, 14, 15, 17, 18, 34, 35, 59, 60, 95].map((a) => stageOf(a).id)).toEqual([
      'baby', 'baby', 'small-child', 'small-child', 'child', 'child', 'early-teen', 'early-teen',
      'late-teen', 'late-teen', 'young-adult', 'young-adult', 'adult', 'adult', 'senior', 'senior',
    ])
    expect(STAGES.map((s) => s.energy)).toEqual([3, 5, 7, 9, 10, 12, 12, 8])
    expect(stageOf(1).categories).toEqual(['people', 'fun', 'health', 'rest'])
    expect(stageOf(4).categories).toEqual(['mind', 'people', 'fun', 'health', 'rest'])
    expect(stageOf(16).categories).toEqual(['school', 'mind', 'body', 'health', 'people', 'money', 'fun', 'rest'])
  })
})
