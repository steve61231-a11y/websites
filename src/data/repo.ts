import type {
  Expense, ExpenseDraft, Vendor, ExpenseCategoryKey,
  Student, StudentDraft, SchoolClass,
  Parent, ParentDraft, ParentNote, StudentParentLink, Relationship,
  Term, FeeInvoice, FeePayment,
  StaffMember, LeaveRecord, LeaveType,
  Profile, Role, Uuid,
} from './types'
import type { Cents } from '@/lib/money'
import type { IsoDate } from '@/lib/dates'

/**
 * The single seam between the UI and wherever the data actually lives.
 *
 * Two implementations ship:
 *   • `supabaseRepo`  — the real backend (Postgres + Auth + RLS + Storage).
 *   • `localRepo`     — a self-contained demo store in the browser, so the app
 *                       can be opened and shown to someone before any keys exist.
 *
 * Collections are returned whole. The school has ~10 students and a few hundred
 * expenses a year; paginating that would cost more in complexity than it saves,
 * and holding full lists is what lets a student's page show their fee balance
 * without a round trip.
 */
export interface Repo {
  readonly mode: 'supabase' | 'demo'

  /* expenses */
  listExpenses(): Promise<Expense[]>
  createExpense(draft: ExpenseDraft): Promise<Expense>
  updateExpense(id: Uuid, patch: Partial<ExpenseDraft>): Promise<Expense>
  deleteExpense(id: Uuid): Promise<void>

  listVendors(): Promise<Vendor[]>
  createVendor(categoryKey: ExpenseCategoryKey, name: string): Promise<Vendor>
  setVendorArchived(id: Uuid, archived: boolean): Promise<void>

  /* students */
  listClasses(): Promise<SchoolClass[]>
  createClass(name: string): Promise<SchoolClass>
  deleteClass(id: Uuid): Promise<void>

  listStudents(): Promise<Student[]>
  createStudent(draft: StudentDraft): Promise<Student>
  updateStudent(id: Uuid, patch: Partial<StudentDraft>): Promise<Student>
  deleteStudent(id: Uuid): Promise<void>
  uploadStudentPhoto(studentId: Uuid, file: File): Promise<string>

  /* parents */
  listParents(): Promise<Parent[]>
  createParent(draft: ParentDraft): Promise<Parent>
  updateParent(id: Uuid, patch: Partial<ParentDraft>): Promise<Parent>
  deleteParent(id: Uuid): Promise<void>

  listLinks(): Promise<StudentParentLink[]>
  linkParent(link: StudentParentLink): Promise<void>
  unlinkParent(studentId: Uuid, parentId: Uuid): Promise<void>

  listParentNotes(): Promise<ParentNote[]>
  addParentNote(parentId: Uuid, body: string, noteDate: IsoDate): Promise<ParentNote>
  deleteParentNote(id: Uuid): Promise<void>

  /* fees */
  listTerms(): Promise<Term[]>
  createTerm(term: Omit<Term, 'id'>): Promise<Term>
  updateTerm(id: Uuid, patch: Partial<Omit<Term, 'id'>>): Promise<Term>

  listInvoices(): Promise<FeeInvoice[]>
  upsertInvoice(input: {
    studentId: Uuid; termId: Uuid; amountDueCents: Cents; dueDate: IsoDate; notes?: string | null
  }): Promise<FeeInvoice>
  deleteInvoice(id: Uuid): Promise<void>

  listPayments(): Promise<FeePayment[]>
  createPayment(input: Omit<FeePayment, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>): Promise<FeePayment>
  deletePayment(id: Uuid): Promise<void>

  /* staff */
  listStaff(): Promise<StaffMember[]>
  createStaff(draft: Omit<StaffMember, 'id'>): Promise<StaffMember>
  updateStaff(id: Uuid, patch: Partial<Omit<StaffMember, 'id'>>): Promise<StaffMember>
  deleteStaff(id: Uuid): Promise<void>

  listLeave(): Promise<LeaveRecord[]>
  createLeave(input: {
    staffId: Uuid; type: LeaveType; startDate: IsoDate; endDate: IsoDate; notes?: string | null
  }): Promise<LeaveRecord>
  deleteLeave(id: Uuid): Promise<void>

  /* people with logins */
  listProfiles(): Promise<Profile[]>
  updateProfileRole(id: Uuid, role: Role): Promise<void>
}

export type { Relationship }
