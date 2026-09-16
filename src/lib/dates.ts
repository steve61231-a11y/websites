/**
 * The school runs on Africa/Nairobi (UTC+3, no DST). "Today" must mean today in
 * Nairobi regardless of where the browser thinks it is, so every calendar
 * question goes through here rather than through `new Date()` directly.
 *
 * Business dates (expense date, payment date, leave dates) are stored as plain
 * 'YYYY-MM-DD' strings — a day has no timezone. Only audit timestamps
 * (created_at) are true instants.
 */
export const SCHOOL_TZ = 'Africa/Nairobi'

export type IsoDate = string // YYYY-MM-DD

const ymdFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SCHOOL_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Today's date in Nairobi, as YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): IsoDate {
  return ymdFormatter.format(now)
}

/** The instant -> the Nairobi calendar day it falls on. */
export function toIsoDate(value: Date | string): IsoDate {
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    return ymdFormatter.format(new Date(value))
  }
  return ymdFormatter.format(value)
}

/** Parse 'YYYY-MM-DD' into a Date pinned to midday UTC, safe from off-by-one drift. */
export function fromIsoDate(iso: IsoDate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const d = fromIsoDate(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function addMonths(iso: IsoDate, months: number): IsoDate {
  const d = fromIsoDate(iso)
  const targetMonth = d.getUTCMonth() + months
  const anchor = new Date(Date.UTC(d.getUTCFullYear(), targetMonth, 1, 12))
  const lastDay = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0, 12)).getUTCDate()
  anchor.setUTCDate(Math.min(d.getUTCDate(), lastDay))
  return anchor.toISOString().slice(0, 10)
}

export function startOfMonth(iso: IsoDate): IsoDate {
  return `${iso.slice(0, 7)}-01`
}

export function endOfMonth(iso: IsoDate): IsoDate {
  const d = fromIsoDate(iso)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 12)).toISOString().slice(0, 10)
}

/** Weeks start on Monday — that is how the school's week actually runs. */
export function startOfWeek(iso: IsoDate): IsoDate {
  const d = fromIsoDate(iso)
  const shift = (d.getUTCDay() + 6) % 7
  return addDays(iso, -shift)
}

export function startOfQuarter(iso: IsoDate): IsoDate {
  const d = fromIsoDate(iso)
  const q = Math.floor(d.getUTCMonth() / 3)
  return `${d.getUTCFullYear()}-${String(q * 3 + 1).padStart(2, '0')}-01`
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((fromIsoDate(to).getTime() - fromIsoDate(from).getTime()) / 86_400_000)
}

export function eachDay(from: IsoDate, to: IsoDate): IsoDate[] {
  const out: IsoDate[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}

export function isWithin(iso: IsoDate, from: IsoDate, to: IsoDate): boolean {
  return iso >= from && iso <= to
}

const LONG = new Intl.DateTimeFormat('en-GB', {
  timeZone: SCHOOL_TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
})
const MEDIUM = new Intl.DateTimeFormat('en-GB', {
  timeZone: SCHOOL_TZ, day: 'numeric', month: 'short', year: 'numeric',
})
const SHORT = new Intl.DateTimeFormat('en-GB', { timeZone: SCHOOL_TZ, day: 'numeric', month: 'short' })
const TIME = new Intl.DateTimeFormat('en-GB', { timeZone: SCHOOL_TZ, hour: '2-digit', minute: '2-digit' })

export function formatDate(iso: IsoDate, style: 'long' | 'medium' | 'short' = 'medium'): string {
  const d = fromIsoDate(iso)
  return style === 'long' ? LONG.format(d) : style === 'short' ? SHORT.format(d) : MEDIUM.format(d)
}

export function formatDateTime(instant: string): string {
  const d = new Date(instant)
  return `${MEDIUM.format(d)} · ${TIME.format(d)}`
}

/** "Today" / "Yesterday" / "3 days ago" / a plain date. Friendlier than a raw date everywhere. */
export function formatRelativeDay(iso: IsoDate, today: IsoDate = todayIso()): string {
  const diff = daysBetween(iso, today)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff === -1) return 'Tomorrow'
  if (diff > 1 && diff < 7) return `${diff} days ago`
  if (diff < -1 && diff > -7) return `In ${Math.abs(diff)} days`
  return formatDate(iso, 'medium')
}

/** Age in whole years, for a student's date of birth. */
export function ageInYears(dob: IsoDate, today: IsoDate = todayIso()): number {
  const [by, bm, bd] = dob.split('-').map(Number)
  const [ty, tm, td] = today.split('-').map(Number)
  let age = ty - by
  if (tm < bm || (tm === bm && td < bd)) age -= 1
  return Math.max(age, 0)
}

/** Greeting that matches the clock the user is actually looking at. */
export function greeting(now: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: SCHOOL_TZ, hour: 'numeric', hour12: false }).format(now),
  )
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
