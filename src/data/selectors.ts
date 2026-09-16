import type {
  Expense, ExpenseCategoryKey, FeeBalance, FeeInvoice, FeePayment, FeeStatus,
  LeaveRecord, Parent, Student, StudentParentLink, Term, Uuid,
} from './types'
import { sumCents, type Cents } from '@/lib/money'
import {
  addDays, daysBetween, eachDay, isWithin, startOfMonth, todayIso, type IsoDate,
} from '@/lib/dates'
import { CATEGORY_ORDER } from '@/brand/categories'

/**
 * Pure derivations over the loaded collections. Keeping these out of components
 * means the same "what does this student owe?" answer is used by the fees page,
 * the student profile and the dashboard — it can never drift between screens.
 */

/* ------------------------------------------------------------------ expenses */

export type DateRange = { from: IsoDate; to: IsoDate; label: string }

export function filterByRange(expenses: readonly Expense[], range: DateRange): Expense[] {
  return expenses.filter((e) => isWithin(e.date, range.from, range.to))
}

export type CategorySlice = {
  key: ExpenseCategoryKey
  totalCents: Cents
  count: number
  share: number
}

export function categoryBreakdown(expenses: readonly Expense[]): CategorySlice[] {
  const totals = new Map<ExpenseCategoryKey, { total: number; count: number }>()
  for (const e of expenses) {
    const bucket = totals.get(e.categoryKey) ?? { total: 0, count: 0 }
    bucket.total += e.amountCents
    bucket.count += 1
    totals.set(e.categoryKey, bucket)
  }
  const grand = sumCents(expenses.map((e) => e.amountCents))
  return [...totals.entries()]
    .map(([key, v]) => ({
      key,
      totalCents: v.total,
      count: v.count,
      share: grand === 0 ? 0 : v.total / grand,
    }))
    .sort((a, b) => b.totalCents - a.totalCents)
}

export type TrendPoint = { bucket: IsoDate; label: string; totalCents: Cents }

/**
 * Buckets spend across the range. Short ranges get one bar per day; long ones
 * get one per week or month, so a bar is always wide enough to tap.
 */
export function spendTrend(expenses: readonly Expense[], range: DateRange): TrendPoint[] {
  const span = daysBetween(range.from, range.to)
  const grain: 'day' | 'week' | 'month' = span <= 31 ? 'day' : span <= 120 ? 'week' : 'month'

  const buckets = new Map<IsoDate, number>()
  const keyFor = (d: IsoDate): IsoDate =>
    grain === 'day' ? d
    : grain === 'month' ? startOfMonth(d)
    : weekStart(d)

  if (grain === 'day') {
    for (const d of eachDay(range.from, range.to)) buckets.set(d, 0)
  } else {
    for (let d = keyFor(range.from); d <= range.to; d = grain === 'month' ? nextMonth(d) : addDays(d, 7)) {
      buckets.set(d, 0)
    }
  }

  for (const e of expenses) {
    const key = keyFor(e.date)
    if (!buckets.has(key)) continue
    buckets.set(key, (buckets.get(key) ?? 0) + e.amountCents)
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([bucket, totalCents]) => ({ bucket, label: bucketLabel(bucket, grain), totalCents }))
}

function weekStart(iso: IsoDate): IsoDate {
  const day = new Date(`${iso}T12:00:00Z`).getUTCDay()
  return addDays(iso, -((day + 6) % 7))
}

function nextMonth(iso: IsoDate): IsoDate {
  const [y, m] = iso.split('-').map(Number)
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
}

const MONTH = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' })

function bucketLabel(iso: IsoDate, grain: 'day' | 'week' | 'month'): string {
  const d = new Date(`${iso}T12:00:00Z`)
  if (grain === 'month') return MONTH.format(d)
  if (grain === 'week') return `${d.getUTCDate()} ${MONTH.format(d)}`
  return String(d.getUTCDate())
}

export type VendorSlice = { name: string; totalCents: Cents; count: number }

export function vendorBreakdown(expenses: readonly Expense[], limit = 6): VendorSlice[] {
  const totals = new Map<string, { total: number; count: number }>()
  for (const e of expenses) {
    const name = e.vendorName || 'Unnamed'
    const b = totals.get(name) ?? { total: 0, count: 0 }
    b.total += e.amountCents
    b.count += 1
    totals.set(name, b)
  }
  return [...totals.entries()]
    .map(([name, v]) => ({ name, totalCents: v.total, count: v.count }))
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, limit)
}

/** Sort order used for category chips and legends everywhere. */
export const categorySortIndex = (key: ExpenseCategoryKey) => CATEGORY_ORDER.indexOf(key)

/* ---------------------------------------------------------------------- fees */

export function feeBalance(
  studentId: Uuid,
  termId: Uuid,
  invoices: readonly FeeInvoice[],
  payments: readonly FeePayment[],
  today: IsoDate = todayIso(),
): FeeBalance {
  const invoice = invoices.find((i) => i.studentId === studentId && i.termId === termId)
  const paidCents = sumCents(
    payments.filter((p) => p.studentId === studentId && p.termId === termId).map((p) => p.amountCents),
  )
  const dueCents = invoice?.amountDueCents ?? 0
  const balanceCents = dueCents - paidCents

  let status: FeeStatus
  if (!invoice) status = 'no-invoice'
  else if (balanceCents <= 0) status = 'paid'
  else if (invoice.dueDate < today) status = 'overdue'
  else if (paidCents > 0) status = 'partial'
  else status = 'unpaid'

  return {
    studentId,
    termId,
    dueCents,
    paidCents,
    balanceCents,
    dueDate: invoice?.dueDate ?? null,
    status,
  }
}

export function feeBalancesForTerm(
  students: readonly Student[],
  termId: Uuid | null,
  invoices: readonly FeeInvoice[],
  payments: readonly FeePayment[],
  today: IsoDate = todayIso(),
): Map<Uuid, FeeBalance> {
  const out = new Map<Uuid, FeeBalance>()
  if (!termId) return out
  for (const s of students) out.set(s.id, feeBalance(s.id, termId, invoices, payments, today))
  return out
}

export const FEE_STATUS_META: Record<FeeStatus, { label: string; tone: 'good' | 'warn' | 'bad' | 'muted'; icon: string }> = {
  paid: { label: 'Paid up', tone: 'good', icon: '✓' },
  partial: { label: 'Part paid', tone: 'warn', icon: '◑' },
  unpaid: { label: 'Not paid yet', tone: 'warn', icon: '○' },
  overdue: { label: 'Overdue', tone: 'bad', icon: '!' },
  'no-invoice': { label: 'No fee set', tone: 'muted', icon: '–' },
}

export function currentTerm(terms: readonly Term[], today: IsoDate = todayIso()): Term | null {
  return (
    terms.find((t) => t.isCurrent) ??
    terms.find((t) => isWithin(today, t.startDate, t.endDate)) ??
    [...terms].sort((a, b) => (a.startDate < b.startDate ? 1 : -1))[0] ??
    null
  )
}

/* --------------------------------------------------------------------- staff */

export const leaveDays = (record: LeaveRecord) => daysBetween(record.startDate, record.endDate) + 1

export function onLeaveOn(records: readonly LeaveRecord[], date: IsoDate = todayIso()): LeaveRecord[] {
  return records.filter((r) => isWithin(date, r.startDate, r.endDate))
}

export function upcomingLeave(
  records: readonly LeaveRecord[],
  today: IsoDate = todayIso(),
  withinDays = 30,
): LeaveRecord[] {
  const horizon = addDays(today, withinDays)
  return records
    .filter((r) => r.startDate > today && r.startDate <= horizon)
    .sort((a, b) => (a.startDate < b.startDate ? -1 : 1))
}

/** Annual-leave days used this calendar year — only meaningful when an allowance is set. */
export function annualLeaveUsed(
  records: readonly LeaveRecord[],
  staffId: Uuid,
  year = Number(todayIso().slice(0, 4)),
): number {
  return records
    .filter((r) => r.staffId === staffId && r.type === 'annual' && r.startDate.startsWith(String(year)))
    .reduce((total, r) => total + leaveDays(r), 0)
}

/* ------------------------------------------------------------------ families */

export function childrenOf(
  parentId: Uuid,
  students: readonly Student[],
  links: readonly StudentParentLink[],
): Student[] {
  const ids = new Set(links.filter((l) => l.parentId === parentId).map((l) => l.studentId))
  return students.filter((s) => ids.has(s.id))
}

export function guardiansOf(
  studentId: Uuid,
  parents: readonly Parent[],
  links: readonly StudentParentLink[],
): Array<Parent & { relationship: StudentParentLink['relationship']; isPrimaryContact: boolean }> {
  return links
    .filter((l) => l.studentId === studentId)
    .flatMap((l) => {
      const parent = parents.find((p) => p.id === l.parentId)
      return parent
        ? [{ ...parent, relationship: l.relationship, isPrimaryContact: l.isPrimaryContact }]
        : []
    })
    .sort((a, b) => Number(b.isPrimaryContact) - Number(a.isPrimaryContact))
}

export const fullName = (s: Pick<Student, 'firstName' | 'lastName'>) =>
  `${s.firstName} ${s.lastName}`.trim()

export const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
