import type { CategoryId, StageId } from './types'

export interface StageDef { id: StageId; from: number; to: number; energy: number; categories: CategoryId[] }

const ALL: CategoryId[] = ['school', 'mind', 'body', 'health', 'people', 'money', 'fun', 'rest']

export const STAGES: readonly StageDef[] = [
  { id: 'baby', from: 0, to: 2, energy: 3, categories: ['people', 'fun', 'health', 'rest'] },
  { id: 'small-child', from: 3, to: 5, energy: 5, categories: ['mind', 'people', 'fun', 'health', 'rest'] },
  { id: 'child', from: 6, to: 11, energy: 7, categories: ALL },
  { id: 'early-teen', from: 12, to: 14, energy: 9, categories: ALL },
  { id: 'late-teen', from: 15, to: 17, energy: 10, categories: ALL },
  { id: 'young-adult', from: 18, to: 34, energy: 12, categories: ALL },
  { id: 'adult', from: 35, to: 59, energy: 12, categories: ALL },
  { id: 'senior', from: 60, to: Infinity, energy: 8, categories: ALL },
]

export function stageOf(age: number): StageDef {
  return STAGES.find((s) => age >= s.from && age <= s.to) ?? STAGES[STAGES.length - 1]!
}
