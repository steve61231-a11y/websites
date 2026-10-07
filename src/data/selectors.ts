import type {
  ChargeBalance, Expense, ExpenseCategoryKey, FeeBalance, FeeCharge, FeeItem, FeePayment,
  FeeStatus, LeaveRecord, Parent, Student, StudentParentLink, Term, Uuid,
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

/** The price the catalogue suggests for this item and class, before any haggling. */
export function defaultAmountFor(item: FeeItem, classId: Uuid | null): Cents {
  if (item.isNegotiated) return 0
  if (classId && item.classAmounts[classId] !== undefined) return item.classAmounts[classId]
  return item.defaultAmountCents ?? 0
}

/** Does this item apply to a child in this class at all? (Uniform is PP1/PP2 only.) */
export function itemAppliesTo(item: FeeItem, classId: Uuid | null): boolean {
  if (item.isArchived) return false
  if (item.limitedToClassIds.length === 0) return true
  return classId !== null && item.limitedToClassIds.includes(classId)
}

/**
 * What to put on a new child's first bill, versus a returning child's.
 * A returning family only owes the recurring things — tuition, and transport if
 * they use it; they are not charged admission or insurance a second time.
 */
export function itemsForStudent(
  items: readonly FeeItem[],
  classId: Uuid | null,
  { isNewAdmission }: { isNewAdmission: boolean },
): FeeItem[] {
  return items
    .filter((item) => itemAppliesTo(item, classId))
    .filter((item) => (isNewAdmission ? true : !item.isAdmissionOnly))
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

function statusForLine(
  charge: FeeCharge,
  paidCents: Cents,
  today: IsoDate,
): FeeStatus {
  if (charge.isWaived) return 'waived'
  // A negotiated line with nothing agreed yet is not a debt — it is a blank.
  if (charge.amountCents === 0 && paidCents === 0) return 'no-invoice'
  if (paidCents >= charge.amountCents) return 'paid'
  if (charge.dueDate && charge.dueDate < today) return 'overdue'
  if (paidCents > 0) return 'partial'
  return 'unpaid'
}

export function chargeBalance(
  charge: FeeCharge,
  items: readonly FeeItem[],
  payments: readonly FeePayment[],
  today: IsoDate = todayIso(),
): ChargeBalance {
  const paidCents = sumCents(
    payments.filter((p) => p.chargeId === charge.id).map((p) => p.amountCents),
  )
  return {
    charge,
    item: items.find((i) => i.key === charge.itemKey) ?? null,
    paidCents,
    balanceCents: charge.isWaived ? 0 : Math.max(charge.amountCents - paidCents, 0),
    status: statusForLine(charge, paidCents, today),
  }
}

/**
 * How much of a term is left on a given day, as a fraction.
 * "If a parent joins later, we prorate the amount as per where the term is."
 */
export function prorationFactor(joinDate: IsoDate, term: Term): number {
  const totalDays = daysBetween(term.startDate, term.endDate) + 1
  if (totalDays <= 0) return 1
  const from = joinDate < term.startDate ? term.startDate : joinDate
  if (from > term.endDate) return 0
  const remainingDays = daysBetween(from, term.endDate) + 1
  return Math.min(Math.max(remainingDays / totalDays, 0), 1)
}

/** A full price scaled to the part of the term a child will actually attend. */
export function proratedAmount(amountCents: Cents, joinDate: IsoDate, term: Term): Cents {
  // Rounded to the nearest 50 shillings: the school quotes round figures to
  // parents, not 19,384.62.
  return Math.round((amountCents * prorationFactor(joinDate, term)) / 5_000) * 5_000
}

/** What is still owing on one term's lines alone, used for the arrears total. */
function outstandingForTerm(
  studentId: Uuid,
  termId: Uuid,
  charges: readonly FeeCharge[],
  payments: readonly FeePayment[],
): Cents {
  const mine = charges.filter(
    (c) => c.studentId === studentId && c.termId === termId && !c.isWaived,
  )
  if (mine.length === 0) return 0
  const ids = new Set(mine.map((c) => c.id))
  const billed = sumCents(mine.map((c) => c.amountCents))
  const paid = sumCents(
    payments
      .filter((p) => p.studentId === studentId)
      .filter((p) => (p.chargeId && ids.has(p.chargeId)) || (!p.chargeId && p.termId === termId))
      .map((p) => p.amountCents),
  )
  return Math.max(billed - paid, 0)
}

/**
 * A student's whole position for a term.
 *
 * Annual and one-off lines (admission, stationery, insurance, uniform) carry no
 * term of their own, so they are folded into whichever term you are looking at:
 * from the school's point of view a family who still owes for stationery owes it
 * now, not in some separate bucket.
 *
 * Anything left unpaid when a term ends follows the family forward as arrears,
 * shown separately from the current bill.
 */
export function feeBalance(
  studentId: Uuid,
  termId: Uuid | null,
  charges: readonly FeeCharge[],
  payments: readonly FeePayment[],
  items: readonly FeeItem[],
  terms: readonly Term[] = [],
  today: IsoDate = todayIso(),
): FeeBalance {
  const mine = charges.filter(
    (c) => c.studentId === studentId && (c.termId === termId || c.termId === null),
  )
  const myPayments = payments.filter((p) => p.studentId === studentId)

  const lines = mine
    .map((c) => chargeBalance(c, items, myPayments, today))
    .sort((a, b) => (a.item?.sortOrder ?? 999) - (b.item?.sortOrder ?? 999))

  const chargeIds = new Set(mine.map((c) => c.id))
  // Money recorded against this student but not put against a line yet. It is
  // still their money, so it has to count towards what they have paid.
  const unallocatedCents = sumCents(
    myPayments
      .filter((p) => (p.chargeId === null || !chargeIds.has(p.chargeId)) && p.termId === termId)
      .map((p) => p.amountCents),
  )

  const dueCents = sumCents(lines.filter((l) => !l.charge.isWaived).map((l) => l.charge.amountCents))
  const paidCents = sumCents(lines.map((l) => l.paidCents)) + unallocatedCents
  const lineBalanceCents = Math.max(dueCents - paidCents, 0)

  // Everything still owing from terms that started before this one.
  const thisTerm = terms.find((t) => t.id === termId) ?? null
  const broughtForwardCents = thisTerm
    ? sumCents(
        terms
          .filter((t) => t.startDate < thisTerm.startDate)
          .map((t) => outstandingForTerm(studentId, t.id, charges, payments)),
      )
    : 0

  const balanceCents = lineBalanceCents + broughtForwardCents

  const outstanding = lines.filter((l) => l.balanceCents > 0)
  const dueDate = outstanding
    .map((l) => l.charge.dueDate)
    .filter((d): d is IsoDate => d !== null)
    .sort()[0] ?? null

  let status: FeeStatus
  if (lines.length === 0 && broughtForwardCents === 0) status = 'no-invoice'
  else if (balanceCents <= 0) status = 'paid'
  // Money owed from a term that has already finished is overdue by definition.
  else if (broughtForwardCents > 0 || outstanding.some((l) => l.status === 'overdue')) status = 'overdue'
  else if (paidCents > 0) status = 'partial'
  else status = 'unpaid'

  return {
    studentId, termId, lines, dueCents, paidCents,
    lineBalanceCents, broughtForwardCents, balanceCents, dueDate, status,
  }
}

export function feeBalancesForTerm(
  students: readonly Student[],
  termId: Uuid | null,
  charges: readonly FeeCharge[],
  payments: readonly FeePayment[],
  items: readonly FeeItem[],
  terms: readonly Term[] = [],
  today: IsoDate = todayIso(),
): Map<Uuid, FeeBalance> {
  const out = new Map<Uuid, FeeBalance>()
  for (const s of students) {
    out.set(s.id, feeBalance(s.id, termId, charges, payments, items, terms, today))
  }
  return out
}

export const FEE_STATUS_META: Record<
  FeeStatus,
  { label: string; tone: 'good' | 'warn' | 'bad' | 'muted'; icon: string }
> = {
  paid: { label: 'Paid up', tone: 'good', icon: '✓' },
  partial: { label: 'Part paid', tone: 'warn', icon: '◑' },
  unpaid: { label: 'Not paid yet', tone: 'warn', icon: '○' },
  overdue: { label: 'Overdue', tone: 'bad', icon: '!' },
  waived: { label: 'Waived', tone: 'muted', icon: '–' },
  'no-invoice': { label: 'Not set', tone: 'muted', icon: '–' },
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
