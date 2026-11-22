import { expect, it } from 'vitest'
import { testLife } from '../life/testLife'
import { exportText, importText } from './backup'

const file = { version: 3 as const, active: testLife(), past: [testLife({ id: 'old' })] }

it('round-trips a save', () => {
  expect(importText(exportText(file))).toEqual(file)
})

it('rejects bad text, a changed body and a newer version', () => {
  expect(importText('nope')).toBeNull()
  expect(importText('{}')).toBeNull()
  expect(importText(exportText(file).replace('life-test', 'life-tesx'))).toBeNull()
  const v4 = JSON.parse(exportText(file))
  v4.file.version = 4
  expect(importText(JSON.stringify(v4))).toBeNull()
})
