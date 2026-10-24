// Number formatting shared by the model, the deck and the exports. Pure.

export function fmtMoney(n) {
  if (n == null || isNaN(n)) return '-'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
  if (abs >= 1_000) return `$${Math.round(n / 1000)}k`
  return `$${Math.round(n)}`
}

export function fmtMoneyFull(n) {
  if (n == null || isNaN(n)) return '-'
  return `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`
}

export function fmtNum(n) {
  if (n == null || isNaN(n)) return '-'
  return Math.round(n).toLocaleString('en-US')
}

// A number with up to `max` decimals and no trailing zeros: 3, 2.5, 0.8, 1,440.
export function fmtDec(n, max = 2) {
  if (n == null || isNaN(n)) return '-'
  return Number(n.toFixed(max)).toLocaleString('en-US', { maximumFractionDigits: max })
}

export function fmtHours(n) {
  if (n == null || isNaN(n)) return '-'
  if (n >= 1000) return `${Math.round(n / 1000)}k hours`
  return `${Math.round(n)} hours`
}

export function fmtMonths(n) {
  if (n == null || isNaN(n) || n <= 0) return 'n/a'
  if (n < 1) return 'under 1 month'
  const r = Math.round(n)
  return `${r} ${r === 1 ? 'month' : 'months'}`
}
