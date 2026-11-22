import type { BelongingDef } from '../../types'

// Second-hand scooter (Honda Beat/Vario class) about Rp 4,5 juta used; resale about two thirds after a few years.
// Second-hand city car (Avanza/Agya class, several years old) about Rp 150 juta; resale about two thirds.
// A modest house outside the big-city centres about Rp 600 juta; resale is held at the price (property keeps its value).
// Unverified: these three figures were not checked against a live source.
export const belongings: BelongingDef[] = [
  { id: 'motorbike', name: 'Motorbike', price: 4_500_000, resale: 3_000_000, energy: 1 },
  { id: 'car', name: 'Car', price: 150_000_000, resale: 100_000_000, energy: 1 },
  { id: 'house', name: 'House', price: 600_000_000, resale: 600_000_000, livingCut: 15_000_000 },
]
