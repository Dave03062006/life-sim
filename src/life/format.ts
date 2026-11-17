export function formatRupiah(amount: number): string {
  const digits = String(Math.abs(amount)).replace(/\B(?=(\d{3})+$)/g, '.')
  return `${amount < 0 ? '−' : ''}Rp ${digits}`
}
