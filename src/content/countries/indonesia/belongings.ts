import type { BelongingDef } from '../../types'

// Prices checked on the web; resale is a game figure (about two thirds for vehicles, the price for the house).
// Motorbike: used Honda BeAT about Rp 8-12 juta in 2025, older injected ones from about Rp 8 juta (oto.detik.com/motor/d-7955673).
// Car: used Avanza 2018 about Rp 120-180 juta (moladin.com/news/daftar-harga-avanza-2018-bekas).
// House: a small subsidised starter house (rumah subsidi); price cap Rp 166-185 juta for 2025, Jabodetabek Rp 185 juta (Kepmen PUPR 689/KPTS/M/2023; bisnis.com 2025-04-25).
// livingCut and the UKT, allowance and lifestyle figures are game figures, not sourced.
export const belongings: BelongingDef[] = [
  { id: 'motorbike', name: 'Motorbike', price: 8_000_000, resale: 5_500_000, energy: 1 },
  { id: 'car', name: 'Car', price: 150_000_000, resale: 100_000_000, energy: 1 },
  { id: 'house', name: 'Starter house', price: 185_000_000, resale: 185_000_000, livingCut: 15_000_000 },
]
