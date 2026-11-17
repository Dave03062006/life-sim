import { expect, it } from 'vitest'
import { formatRupiah } from './format'

it('writes Rupiah with dots', () => {
  expect(formatRupiah(215000)).toBe('Rp 215.000')
  expect(formatRupiah(4500000)).toBe('Rp 4.500.000')
  expect(formatRupiah(-85000)).toBe('−Rp 85.000')
  expect(formatRupiah(0)).toBe('Rp 0')
})
