/**
 * Money is *always* an integer number of cents (1 KES = 100 cents).
 * Floats are never used for money anywhere in this app — not in state, not in
 * the database, not in a chart. Convert at the edges only, with these helpers.
 */
export type Cents = number

const KES = new Intl.NumberFormat('en-KE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const KES_PRECISE = new Intl.NumberFormat('en-KE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** "KES 45,200" — the default. Cents are hidden unless they are non-zero. */
export function formatKes(cents: Cents, opts: { sign?: boolean; prefix?: boolean } = {}): string {
  const { sign = false, prefix = true } = opts
  const abs = Math.abs(Math.round(cents))
  const body = abs % 100 === 0 ? KES.format(abs / 100) : KES_PRECISE.format(abs / 100)
  const neg = Math.round(cents) < 0
  const marker = neg ? '−' : sign ? '+' : ''
  return `${marker}${prefix ? 'KES ' : ''}${body}`
}

/** Compact form for chart axes only, where space is genuinely tight: "45.2k". */
export function formatKesShort(cents: Cents): string {
  const v = Math.round(cents) / 100
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${trim(v / 1_000_000)}M`
  if (abs >= 1_000) return `${trim(v / 1_000)}k`
  return trim(v)
}

function trim(n: number) {
  return Number(n.toFixed(1)).toString()
}

/** Parse what a human typed ("12,500", "12500.50", "12 500") into cents. */
export function parseKesToCents(input: string): Cents | null {
  const cleaned = input.replace(/[^\d.]/g, '')
  if (!cleaned || cleaned === '.') return null
  const parts = cleaned.split('.')
  if (parts.length > 2) return null
  const shillings = parts[0] === '' ? 0 : Number(parts[0])
  const fraction = parts[1] ? Number(`0.${parts[1].slice(0, 2)}`) : 0
  if (!Number.isFinite(shillings) || !Number.isFinite(fraction)) return null
  return Math.round(shillings * 100 + fraction * 100)
}

/** Percentage change, guarding the divide-by-zero that makes dashboards say "Infinity%". */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / Math.abs(previous)) * 100
}

/**
 * Append digits to an amount as whole shillings. The keypad never produces a
 * fraction: typing 2 0 0 0 0 gives KES 20,000, not KES 200.00. Nobody at this
 * school deals in cents, and two extra keystrokes on every amount is the
 * fastest way to make an app annoying.
 */
export function appendShillings(valueCents: Cents, digits: string, max = 1_000_000_000): Cents {
  let next = valueCents
  for (const digit of digits) {
    if (!/\d/.test(digit)) continue
    next = next * 10 + Number(digit) * 100
  }
  return next > max ? valueCents : next
}

/** Undo one keypress on the shillings. */
export function dropLastShilling(valueCents: Cents): Cents {
  return Math.floor(valueCents / 1000) * 100
}

/**
 * Does a typed search term look like this amount?
 *
 * People search for money the way they say it: "20000", "20,000" or "20k" all
 * mean the same payment. Matching on the digits alone means the commas a user
 * does or does not type never decide whether they find it.
 */
export function matchesAmount(query: string, cents: Cents): boolean {
  const raw = query.trim().toLowerCase().replace(/[\s,]/g, '')
  if (!raw) return false

  const shillings = Math.round(cents / 100)

  // "20k" / "1.5k"
  const shorthand = raw.match(/^(\d+(?:\.\d+)?)k$/)
  if (shorthand) return Math.round(Number(shorthand[1]) * 1000) === shillings

  if (!/^\d+(?:\.\d+)?$/.test(raw)) return false

  const asNumber = Number(raw)
  if (Number.isFinite(asNumber) && Math.round(asNumber) === shillings) return true

  // Otherwise fall back to "does the figure contain these digits", so a partial
  // "200" still surfaces 2,000 and 20,000 rather than nothing at all.
  return String(shillings).includes(raw)
}

export function sumCents(values: Iterable<Cents>): Cents {
  let total = 0
  for (const v of values) total += v
  return total
}
