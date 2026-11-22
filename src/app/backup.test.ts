import { expect, it } from 'vitest'
import { testLife } from '../life/testLife'
import { exportText, importText } from './backup'

const file = { version: 4 as const, active: testLife(), past: [testLife({ id: 'old' })] }

it('round-trips a save', () => {
  expect(importText(exportText(file))).toEqual(file)
})

it('rejects bad text, a changed body and a newer version', () => {
  expect(importText('nope')).toBeNull()
  expect(importText('{}')).toBeNull()
  expect(importText(exportText(file).replace('life-test', 'life-tesx'))).toBeNull()
  const v5 = JSON.parse(exportText(file))
  v5.file.version = 5
  expect(importText(JSON.stringify(v5))).toBeNull()
})
