import type { Repo } from './repo'
import type {
  Expense, ExpenseDraft, Vendor, ExpenseCategoryKey, Student, StudentDraft, SchoolClass,
  Parent, ParentDraft, ParentNote, StudentParentLink, Term, FeeInvoice, FeePayment,
  StaffMember, LeaveRecord, LeaveType, Profile, Role, Uuid,
} from './types'
import type { Cents } from '@/lib/money'
import type { IsoDate } from '@/lib/dates'
import {
  DEMO_CLASSES, DEMO_EXPENSES, DEMO_INVOICES, DEMO_LEAVE, DEMO_LINKS, DEMO_PARENTS,
  DEMO_PARENT_NOTES, DEMO_PAYMENTS, DEMO_PROFILE, DEMO_PROFILES, DEMO_STAFF,
  DEMO_STUDENTS, DEMO_TERMS, DEMO_VENDORS,
} from './seed'

/**
 * Demo store — the whole system running against the browser's own storage.
 *
 * It exists so the app can be opened, clicked through and shown to someone
 * before a single Supabase key has been issued, and so a demo never writes to
 * the school's real records. Everything is persisted under one localStorage key
 * and can be wiped from Settings.
 */

const STORAGE_KEY = 'iris-fields:demo:v1'

type Store = {
  expenses: Expense[]
  vendors: Vendor[]
  classes: SchoolClass[]
  students: Student[]
  parents: Parent[]
  links: StudentParentLink[]
  parentNotes: ParentNote[]
  terms: Term[]
  invoices: FeeInvoice[]
  payments: FeePayment[]
  staff: StaffMember[]
  leave: LeaveRecord[]
  profiles: Profile[]
}

function freshStore(): Store {
  return {
    expenses: [...DEMO_EXPENSES],
    vendors: [...DEMO_VENDORS],
    classes: [...DEMO_CLASSES],
    students: [...DEMO_STUDENTS],
    parents: [...DEMO_PARENTS],
    links: [...DEMO_LINKS],
    parentNotes: [...DEMO_PARENT_NOTES],
    terms: [...DEMO_TERMS],
    invoices: [...DEMO_INVOICES],
    payments: [...DEMO_PAYMENTS],
    staff: [...DEMO_STAFF],
    leave: [...DEMO_LEAVE],
    profiles: [...DEMO_PROFILES],
  }
}

let store: Store | null = null

function load(): Store {
  if (store) return store
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    store = raw ? { ...freshStore(), ...(JSON.parse(raw) as Store) } : freshStore()
  } catch {
    // Private browsing, cleared site data, quota — the demo still has to work.
    store = freshStore()
  }
  return store
}

function save(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(load()))
  } catch {
    /* Storage is a convenience here, never a correctness requirement. */
  }
}

export function resetDemoData(): void {
  store = freshStore()
  save()
}

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2)}-${Date.now()}`)

const now = () => new Date().toISOString()

/** A touch of latency so loading states are real in the demo, not a flash. */
const settle = <T,>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), 90))

function requireRow<T extends { id: string }>(rows: T[], id: string, what: string): T {
  const row = rows.find((r) => r.id === id)
  if (!row) throw new Error(`That ${what} no longer exists.`)
  return row
}

export const localRepo: Repo = {
  mode: 'demo',

  /* ------------------------------------------------------------- expenses */
  listExpenses: () => settle([...load().expenses].sort((a, b) => (a.date < b.date ? 1 : -1))),

  async createExpense(draft: ExpenseDraft) {
    const s = load()
    const expense: Expense = {
      id: uid(),
      date: draft.date,
      categoryKey: draft.categoryKey,
      customCategory: draft.customCategory ?? null,
      vendorId: draft.vendorId ?? null,
      vendorName: draft.vendorName,
      amountCents: draft.amountCents,
      paymentMethod: draft.paymentMethod,
      notes: draft.notes ?? null,
      createdBy: DEMO_PROFILE.id,
      createdByName: DEMO_PROFILE.fullName,
      createdAt: now(),
    }
    s.expenses.unshift(expense)
    const vendor = s.vendors.find((v) => v.id === draft.vendorId)
    if (vendor) {
      vendor.usageCount += 1
      vendor.lastUsedAt = now()
    }
    save()
    return settle(expense)
  },

  async updateExpense(id: Uuid, patch: Partial<ExpenseDraft>) {
    const s = load()
    const row = requireRow(s.expenses, id, 'expense')
    Object.assign(row, patch)
    save()
    return settle(row)
  },

  async deleteExpense(id: Uuid) {
    const s = load()
    s.expenses = s.expenses.filter((e) => e.id !== id)
    save()
    return settle(undefined)
  },

  listVendors: () => settle([...load().vendors]),

  async createVendor(categoryKey: ExpenseCategoryKey, name: string) {
    const s = load()
    const existing = s.vendors.find(
      (v) => v.categoryKey === categoryKey && v.name.toLowerCase() === name.trim().toLowerCase(),
    )
    if (existing) {
      existing.isArchived = false
      save()
      return settle(existing)
    }
    const vendor: Vendor = {
      id: uid(), categoryKey, name: name.trim(), usageCount: 0, lastUsedAt: null, isArchived: false,
    }
    s.vendors.push(vendor)
    save()
    return settle(vendor)
  },

  async setVendorArchived(id: Uuid, archived: boolean) {
    requireRow(load().vendors, id, 'vendor').isArchived = archived
    save()
    return settle(undefined)
  },

  /* ------------------------------------------------------------- students */
  listClasses: () => settle([...load().classes].sort((a, b) => a.sortOrder - b.sortOrder)),

  async createClass(name: string) {
    const s = load()
    const cls: SchoolClass = { id: uid(), name: name.trim(), sortOrder: (s.classes.length + 1) * 10 }
    s.classes.push(cls)
    save()
    return settle(cls)
  },

  async deleteClass(id: Uuid) {
    const s = load()
    s.classes = s.classes.filter((c) => c.id !== id)
    s.students = s.students.map((st) =>
      st.classId === id ? { ...st, classId: null, className: null } : st,
    )
    save()
    return settle(undefined)
  },

  listStudents: () => {
    const s = load()
    const withClass = s.students.map((st) => ({
      ...st,
      className: s.classes.find((c) => c.id === st.classId)?.name ?? null,
    }))
    return settle(withClass)
  },

  async createStudent(draft: StudentDraft) {
    const s = load()
    const student: Student = {
      ...draft,
      id: uid(),
      className: s.classes.find((c) => c.id === draft.classId)?.name ?? null,
      createdAt: now(),
    }
    s.students.push(student)
    save()
    return settle(student)
  },

  async updateStudent(id: Uuid, patch: Partial<StudentDraft>) {
    const s = load()
    const row = requireRow(s.students, id, 'student')
    Object.assign(row, patch)
    row.className = s.classes.find((c) => c.id === row.classId)?.name ?? null
    save()
    return settle(row)
  },

  async deleteStudent(id: Uuid) {
    const s = load()
    s.students = s.students.filter((st) => st.id !== id)
    s.links = s.links.filter((l) => l.studentId !== id)
    s.invoices = s.invoices.filter((i) => i.studentId !== id)
    s.payments = s.payments.filter((p) => p.studentId !== id)
    save()
    return settle(undefined)
  },

  /** Demo photos never leave the browser — they are inlined as data URLs. */
  uploadStudentPhoto: (_studentId: Uuid, file: File) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Could not read that image.'))
      reader.readAsDataURL(file)
    }),

  /* -------------------------------------------------------------- parents */
  listParents: () => settle([...load().parents]),

  async createParent(draft: ParentDraft) {
    const s = load()
    const parent: Parent = { ...draft, id: uid(), createdAt: now() }
    s.parents.push(parent)
    save()
    return settle(parent)
  },

  async updateParent(id: Uuid, patch: Partial<ParentDraft>) {
    const row = requireRow(load().parents, id, 'parent')
    Object.assign(row, patch)
    save()
    return settle(row)
  },

  async deleteParent(id: Uuid) {
    const s = load()
    s.parents = s.parents.filter((p) => p.id !== id)
    s.links = s.links.filter((l) => l.parentId !== id)
    s.parentNotes = s.parentNotes.filter((n) => n.parentId !== id)
    save()
    return settle(undefined)
  },

  listLinks: () => settle([...load().links]),

  async linkParent(link: StudentParentLink) {
    const s = load()
    s.links = s.links.filter(
      (l) => !(l.studentId === link.studentId && l.parentId === link.parentId),
    )
    s.links.push(link)
    save()
    return settle(undefined)
  },

  async unlinkParent(studentId: Uuid, parentId: Uuid) {
    const s = load()
    s.links = s.links.filter((l) => !(l.studentId === studentId && l.parentId === parentId))
    save()
    return settle(undefined)
  },

  listParentNotes: () =>
    settle([...load().parentNotes].sort((a, b) => (a.noteDate < b.noteDate ? 1 : -1))),

  async addParentNote(parentId: Uuid, body: string, noteDate: IsoDate) {
    const s = load()
    const note: ParentNote = {
      id: uid(), parentId, noteDate, body: body.trim(),
      createdBy: DEMO_PROFILE.id, createdByName: DEMO_PROFILE.fullName, createdAt: now(),
    }
    s.parentNotes.unshift(note)
    save()
    return settle(note)
  },

  async deleteParentNote(id: Uuid) {
    const s = load()
    s.parentNotes = s.parentNotes.filter((n) => n.id !== id)
    save()
    return settle(undefined)
  },

  /* ----------------------------------------------------------------- fees */
  listTerms: () => settle([...load().terms].sort((a, b) => (a.startDate < b.startDate ? -1 : 1))),

  async createTerm(term: Omit<Term, 'id'>) {
    const s = load()
    if (term.isCurrent) s.terms.forEach((t) => (t.isCurrent = false))
    const created: Term = { ...term, id: uid() }
    s.terms.push(created)
    save()
    return settle(created)
  },

  async updateTerm(id: Uuid, patch: Partial<Omit<Term, 'id'>>) {
    const s = load()
    if (patch.isCurrent) s.terms.forEach((t) => (t.isCurrent = false))
    const row = requireRow(s.terms, id, 'term')
    Object.assign(row, patch)
    save()
    return settle(row)
  },

  listInvoices: () => settle([...load().invoices]),

  async upsertInvoice(input) {
    const s = load()
    const existing = s.invoices.find(
      (i) => i.studentId === input.studentId && i.termId === input.termId,
    )
    if (existing) {
      existing.amountDueCents = input.amountDueCents
      existing.dueDate = input.dueDate
      existing.notes = input.notes ?? null
      save()
      return settle(existing)
    }
    const invoice: FeeInvoice = {
      id: uid(),
      studentId: input.studentId,
      termId: input.termId,
      amountDueCents: input.amountDueCents,
      dueDate: input.dueDate,
      notes: input.notes ?? null,
      createdAt: now(),
    }
    s.invoices.push(invoice)
    save()
    return settle(invoice)
  },

  async deleteInvoice(id: Uuid) {
    const s = load()
    s.invoices = s.invoices.filter((i) => i.id !== id)
    save()
    return settle(undefined)
  },

  listPayments: () => settle([...load().payments].sort((a, b) => (a.paidOn < b.paidOn ? 1 : -1))),

  async createPayment(input) {
    const s = load()
    const payment: FeePayment = {
      ...input,
      id: uid(),
      createdBy: DEMO_PROFILE.id,
      createdByName: DEMO_PROFILE.fullName,
      createdAt: now(),
    }
    s.payments.unshift(payment)
    save()
    return settle(payment)
  },

  async deletePayment(id: Uuid) {
    const s = load()
    s.payments = s.payments.filter((p) => p.id !== id)
    save()
    return settle(undefined)
  },

  /* ---------------------------------------------------------------- staff */
  listStaff: () => settle([...load().staff]),

  async createStaff(draft: Omit<StaffMember, 'id'>) {
    const s = load()
    const member: StaffMember = { ...draft, id: uid() }
    s.staff.push(member)
    save()
    return settle(member)
  },

  async updateStaff(id: Uuid, patch: Partial<Omit<StaffMember, 'id'>>) {
    const row = requireRow(load().staff, id, 'staff member')
    Object.assign(row, patch)
    save()
    return settle(row)
  },

  async deleteStaff(id: Uuid) {
    const s = load()
    s.staff = s.staff.filter((m) => m.id !== id)
    s.leave = s.leave.filter((l) => l.staffId !== id)
    save()
    return settle(undefined)
  },

  listLeave: () => settle([...load().leave].sort((a, b) => (a.startDate < b.startDate ? 1 : -1))),

  async createLeave(input: {
    staffId: Uuid; type: LeaveType; startDate: IsoDate; endDate: IsoDate; notes?: string | null
  }) {
    const s = load()
    const record: LeaveRecord = {
      id: uid(),
      staffId: input.staffId,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      notes: input.notes ?? null,
      createdBy: DEMO_PROFILE.id,
      createdAt: now(),
    }
    s.leave.unshift(record)
    save()
    return settle(record)
  },

  async deleteLeave(id: Uuid) {
    const s = load()
    s.leave = s.leave.filter((l) => l.id !== id)
    save()
    return settle(undefined)
  },

  /* -------------------------------------------------------------- people */
  listProfiles: () => settle([...load().profiles]),

  async updateProfileRole(id: Uuid, role: Role) {
    requireRow(load().profiles, id, 'user').role = role
    save()
    return settle(undefined)
  },
}

export type { Cents }
