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

export type FeeInvoice = {
  id: Uuid
  studentId: Uuid
  termId: Uuid
  amountDueCents: Cents
  dueDate: IsoDate
  notes: string | null
  createdAt: Instant
}

export type FeePayment = {
  id: Uuid
  studentId: Uuid
  termId: Uuid | null
  amountCents: Cents
  paidOn: IsoDate
  method: PaymentMethod
  reference: string | null
  notes: string | null
  createdBy: Uuid | null
  createdByName: string | null
  createdAt: Instant
}

export type FeeStatus = 'paid' | 'partial' | 'unpaid' | 'overdue' | 'no-invoice'

/** A student's fee position for one term — computed, never stored. */
export type FeeBalance = {
  studentId: Uuid
  termId: Uuid
  dueCents: Cents
  paidCents: Cents
  balanceCents: Cents
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
