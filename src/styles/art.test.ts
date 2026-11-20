import { existsSync } from 'node:fs'
import { expect, it } from 'vitest'
import manifest from './art-manifest.json'
import { gameScenePath, hasIcon, iconIndex, scenePath } from './art'

it('finds an icon, then its fallback, then the first icon', () => {
  expect(iconIndex('act-futsal', 'cat-body')).toBe(28)
  expect(iconIndex('not-drawn-yet', 'cat-body')).toBe(2)
  expect(iconIndex('not-drawn-yet', 'nor-this')).toBe(0)
  expect([hasIcon('act-futsal'), hasIcon('not-drawn-yet')]).toEqual([true, false])
})
it('falls back to the nearest stage, then the other gender', () => {
  expect(scenePath('late-teen', 'male', 'flat')).toBe('/art/scene-late-teen-male-flat.webp')
  expect(scenePath('adult', 'female', 'pixel')).toBe('/art/scene-late-teen-male-pixel.webp')
})
it('has a mini-game scene for Body and a plain panel elsewhere', () => {
  expect(gameScenePath('body', 'flat')).toBe('/art/game-body-flat.webp')
  expect(gameScenePath('mind', 'flat')).toBeNull()
})
it('names only files that exist', () => {
  const paths = JSON.stringify(manifest).match(/\/art\/[^"]+/g) ?? []
  expect(paths.length).toBeGreaterThan(8)
  for (const p of paths) expect({ p, found: existsSync(`public${p}`) }).toEqual({ p, found: true })
})
