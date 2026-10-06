import type { Cents } from '@/lib/money'
import type { IsoDate } from '@/lib/dates'

export type Uuid = string
/** ISO-8601 instant, e.g. '2026-09-16T07:20:00.000Z'. Audit trail only. */
export type Instant = string

export type Role = 'admin' | 'staff'

export type Profile = {
  id: Uuid
  fullName: string
  email: string
  role: Role
  createdAt: Instant
}

/* ------------------------------------------------------------------ expenses */

export type ExpenseCategoryKey =
  | 'supermarket' | 'groceries' | 'fuel' | 'salaries' | 'water' | 'repairs' | 'other'

export type PaymentMethod = 'cash' | 'mpesa' | 'bank'

export type Vendor = {
  id: Uuid
  categoryKey: ExpenseCategoryKey
  name: string
  /** Drives "recently used first" ordering of the quick-select chips. */
  usageCount: number
  lastUsedAt: Instant | null
  isArchived: boolean
}

export type Expense = {
  id: Uuid
  /** Business date in Africa/Nairobi. Not an instant. */
  date: IsoDate
  categoryKey: ExpenseCategoryKey
  /** Free-text label when categoryKey is 'other'. */
  customCategory: string | null
  vendorId: Uuid | null
  /** Denormalised so a renamed/archived vendor never rewrites history. */
  vendorName: string
  amountCents: Cents
  paymentMethod: PaymentMethod
  notes: string | null
  createdBy: Uuid | null
  createdByName: string | null
  createdAt: Instant
}

export type ExpenseDraft = {
  date: IsoDate
  categoryKey: ExpenseCategoryKey
  customCategory?: string | null
  vendorId?: Uuid | null
  vendorName: string
  amountCents: Cents
  paymentMethod: PaymentMethod
  notes?: string | null
}

/* ------------------------------------------------------------------ students */

export type SchoolClass = {
  id: Uuid
  name: string
  sortOrder: number
}

export type StudentStatus = 'active' | 'graduated' | 'withdrawn'

export type Student = {
  id: Uuid
  firstName: string
  lastName: string
  dateOfBirth: IsoDate | null
  photoUrl: string | null
  classId: Uuid | null
  className: string | null
  enrollmentDate: IsoDate
  status: StudentStatus
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  allergies: string[]
  medicalNotes: string | null
  createdAt: Instant
}

export type StudentDraft = Omit<Student, 'id' | 'createdAt' | 'className'>

export type Relationship = 'mother' | 'father' | 'guardian' | 'other'

export type Parent = {
  id: Uuid
  fullName: string
  phone: string
  email: string | null
  createdAt: Instant
}

export type ParentDraft = Omit<Parent, 'id' | 'createdAt'>

export type StudentParentLink = {
  studentId: Uuid
  parentId: Uuid
  relationship: Relationship
  isPrimaryContact: boolean
}

export type ParentNote = {
  id: Uuid
  parentId: Uuid
  noteDate: IsoDate
  body: string
  createdBy: Uuid | null
  createdByName: string | null
  createdAt: Instant
}

/* ---------------------------------------------------------------------- fees */

export type Term = {
  id: Uuid
  name: string
  startDate: IsoDate
  endDate: IsoDate
  isCurrent: boolean
}

/**
 * How often a fee item is charged. This is what makes the difference between
 * "tuition, every term" and "insurance, once a year" and "daycare, per day".
 */
export type FeeCycle =
  /** Charged again every term — tuition, transport. */
  | 'term'
  /** Charged once per school year — stationery, insurance. */
  | 'year'
  /** Charged once, when the child joins — admission, uniform. */
  | 'once'
  /** Amount is days attended × a daily rate — daycare. */
  | 'daily'

export type FeeItemKey = string

/**
 * The school's price list. Every amount here is only a *default* — the amount
 * actually charged lives on the student's own line and can always be edited,
 * because in practice nearly everything gets negotiated with the parent.
 */
export type FeeItem = {
  key: FeeItemKey
  label: string
  emoji: string
  cycle: FeeCycle
  /** Flat default, in cents. Null when the price depends on the class. */
  defaultAmountCents: Cents | null
  /** Per-class defaults, keyed by class id. Wins over defaultAmountCents. */
  classAmounts: Record<Uuid, Cents>
  /** Optional items are never added automatically — somebody has to choose them. */
  isOptional: boolean
  /** Charged when a child first joins, as opposed to every term. */
  isAdmissionOnly: boolean
  /**
   * When set, the item only applies to these classes (uniform is PP1/PP2 only).
   * Empty means it applies to everyone.
   */
  limitedToClassIds: Uuid[]
  /** No price list entry at all — the amount is agreed per family (transport). */
  isNegotiated: boolean
  sortOrder: number
  isArchived: boolean
}

/**
 * One line on a student's bill: "Tuition & meals, Term 3, KES 37,000".
 * Replaces the old single lump-sum invoice — a family can be fully paid up on
 * tuition while still owing for transport, and the school needs to see that.
 */
export type FeeCharge = {
  id: Uuid
  studentId: Uuid
  itemKey: FeeItemKey
  /** Null for annual and one-off items, which do not belong to a single term. */
  termId: Uuid | null
  amountCents: Cents
  dueDate: IsoDate | null
  /** For 'daily' items: how many days this line covers. */
  quantity: number | null
  notes: string | null
  /** Written off or not applicable — counts as settled, not as owing. */
  isWaived: boolean
  createdAt: Instant
}

export type FeeChargeDraft = Omit<FeeCharge, 'id' | 'createdAt'>

export type FeePayment = {
  id: Uuid
  studentId: Uuid
  termId: Uuid | null
  /** Which line this money was put against. Null = not allocated yet. */
  chargeId: Uuid | null
  amountCents: Cents
  paidOn: IsoDate
  method: PaymentMethod
  reference: string | null
  notes: string | null
  createdBy: Uuid | null
  createdByName: string | null
  createdAt: Instant
}

export type FeeStatus = 'paid' | 'partial' | 'unpaid' | 'overdue' | 'waived' | 'no-invoice'

/** What one line on the bill currently stands at — computed, never stored. */
export type ChargeBalance = {
  charge: FeeCharge
  item: FeeItem | null
  paidCents: Cents
  balanceCents: Cents
  status: FeeStatus
}

/** A student's whole fee position for a term — every line, plus the totals. */
export type FeeBalance = {
  studentId: Uuid
  termId: Uuid | null
  lines: ChargeBalance[]
  dueCents: Cents
  paidCents: Cents
  balanceCents: Cents
  /** Earliest unmet due date across the lines, for the overdue check. */
  dueDate: IsoDate | null
  status: FeeStatus
}

/* --------------------------------------------------------------------- staff */

export type StaffMember = {
  id: Uuid
  fullName: string
  roleTitle: string
  phone: string | null
  email: string | null
  startDate: IsoDate | null
  isActive: boolean
  /** Optional annual-leave allowance. Null = the school just keeps a log. */
  annualLeaveDays: number | null
}

export type LeaveType = 'annual' | 'sick' | 'other'

export type LeaveRecord = {
  id: Uuid
  staffId: Uuid
  type: LeaveType
  startDate: IsoDate
  endDate: IsoDate
  notes: string | null
  createdBy: Uuid | null
  createdAt: Instant
}

/* ------------------------------------------------------------------ settings */

export type SchoolSettings = {
  schoolName: string
  /** Shown on the dashboard and in exports. */
  currentTermId: Uuid | null
}
