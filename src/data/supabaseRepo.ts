import type { Repo } from './repo'
import type {
  Expense, ExpenseDraft, Vendor, ExpenseCategoryKey, Student, StudentDraft, SchoolClass,
  Parent, ParentDraft, ParentNote, StudentParentLink, Term, FeeInvoice, FeePayment,
  StaffMember, LeaveRecord, LeaveType, Profile, Role, Uuid,
} from './types'
import type { IsoDate } from '@/lib/dates'
import { supabase } from '@/lib/supabase'
import type { PostgrestSingleResponse, SupabaseClient } from '@supabase/supabase-js'

/**
 * The real backend. Every method is a thin, explicit mapping between the
 * database's snake_case rows and the app's camelCase domain types — no ORM, no
 * magic, so a future maintainer can read a query and know exactly what runs.
 */

function db(): SupabaseClient {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function unwrap<T>({ data, error }: PostgrestSingleResponse<T>): T {
  if (error) throw new Error(error.message)
  if (data === null) throw new Error('No data returned.')
  return data
}

async function currentUserId(): Promise<string | null> {
  const { data } = await db().auth.getUser()
  return data.user?.id ?? null
}

/* ------------------------------------------------------------------ rows -> domain */

type CreatorJoin = { full_name: string | null } | Array<{ full_name: string | null }> | null
const creatorName = (c: CreatorJoin): string | null =>
  Array.isArray(c) ? c[0]?.full_name ?? null : c?.full_name ?? null

const toExpense = (r: Record<string, any>): Expense => ({
  id: r.id,
  date: r.date,
  categoryKey: r.category_key,
  customCategory: r.custom_category,
  vendorId: r.vendor_id,
  vendorName: r.vendor_name ?? '',
  amountCents: Number(r.amount_cents),
  paymentMethod: r.payment_method,
  notes: r.notes,
  createdBy: r.created_by,
  createdByName: creatorName(r.created_by_profile),
  createdAt: r.created_at,
})

const toVendor = (r: Record<string, any>): Vendor => ({
  id: r.id,
  categoryKey: r.category_key,
  name: r.name,
  usageCount: r.usage_count ?? 0,
  lastUsedAt: r.last_used_at,
  isArchived: r.is_archived ?? false,
})

const toStudent = (r: Record<string, any>): Student => ({
  id: r.id,
  firstName: r.first_name,
  lastName: r.last_name ?? '',
  dateOfBirth: r.date_of_birth,
  photoUrl: r.photo_url,
  classId: r.class_id,
  className: Array.isArray(r.classes) ? r.classes[0]?.name ?? null : r.classes?.name ?? null,
  enrollmentDate: r.enrollment_date,
  status: r.status,
  emergencyContactName: r.emergency_contact_name,
  emergencyContactPhone: r.emergency_contact_phone,
  allergies: r.allergies ?? [],
  medicalNotes: r.medical_notes,
  createdAt: r.created_at,
})

const toParent = (r: Record<string, any>): Parent => ({
  id: r.id, fullName: r.full_name, phone: r.phone ?? '', email: r.email, createdAt: r.created_at,
})

const toNote = (r: Record<string, any>): ParentNote => ({
  id: r.id,
  parentId: r.parent_id,
  noteDate: r.note_date,
  body: r.body,
  createdBy: r.created_by,
  createdByName: creatorName(r.created_by_profile),
  createdAt: r.created_at,
})

const toTerm = (r: Record<string, any>): Term => ({
  id: r.id, name: r.name, startDate: r.start_date, endDate: r.end_date, isCurrent: r.is_current,
})

const toInvoice = (r: Record<string, any>): FeeInvoice => ({
  id: r.id,
  studentId: r.student_id,
  termId: r.term_id,
  amountDueCents: Number(r.amount_due_cents),
  dueDate: r.due_date,
  notes: r.notes,
  createdAt: r.created_at,
})

const toPayment = (r: Record<string, any>): FeePayment => ({
  id: r.id,
  studentId: r.student_id,
  termId: r.term_id,
  amountCents: Number(r.amount_cents),
  paidOn: r.paid_on,
  method: r.method,
  reference: r.reference,
  notes: r.notes,
  createdBy: r.created_by,
  createdByName: creatorName(r.created_by_profile),
  createdAt: r.created_at,
})

const toStaff = (r: Record<string, any>): StaffMember => ({
  id: r.id,
  fullName: r.full_name,
  roleTitle: r.role_title ?? '',
  phone: r.phone,
  email: r.email,
  startDate: r.start_date,
  isActive: r.is_active,
  annualLeaveDays: r.annual_leave_days,
})

const toLeave = (r: Record<string, any>): LeaveRecord => ({
  id: r.id,
  staffId: r.staff_id,
  type: r.type,
  startDate: r.start_date,
  endDate: r.end_date,
  notes: r.notes,
  createdBy: r.created_by,
  createdAt: r.created_at,
})

const EXPENSE_SELECT = '*, created_by_profile:profiles!expenses_created_by_fkey(full_name)'
const NOTE_SELECT = '*, created_by_profile:profiles!parent_notes_created_by_fkey(full_name)'
const PAYMENT_SELECT = '*, created_by_profile:profiles!fee_payments_created_by_fkey(full_name)'

/* ------------------------------------------------------------------------ repo */

export const supabaseRepo: Repo = {
  mode: 'supabase',

  /* ------------------------------------------------------------- expenses */
  async listExpenses() {
    const rows = unwrap(
      await db().from('expenses').select(EXPENSE_SELECT).order('date', { ascending: false })
        .order('created_at', { ascending: false }),
    )
    return rows.map(toExpense)
  },

  async createExpense(draft: ExpenseDraft) {
    const row = unwrap(
      await db().from('expenses').insert({
        date: draft.date,
        category_key: draft.categoryKey,
        custom_category: draft.customCategory ?? null,
        vendor_id: draft.vendorId ?? null,
        vendor_name: draft.vendorName,
        amount_cents: draft.amountCents,
        payment_method: draft.paymentMethod,
        notes: draft.notes ?? null,
        created_by: await currentUserId(),
      }).select(EXPENSE_SELECT).single(),
    )
    return toExpense(row)
  },

  async updateExpense(id: Uuid, patch: Partial<ExpenseDraft>) {
    const row = unwrap(
      await db().from('expenses').update({
        ...(patch.date !== undefined && { date: patch.date }),
        ...(patch.categoryKey !== undefined && { category_key: patch.categoryKey }),
        ...(patch.customCategory !== undefined && { custom_category: patch.customCategory }),
        ...(patch.vendorId !== undefined && { vendor_id: patch.vendorId }),
        ...(patch.vendorName !== undefined && { vendor_name: patch.vendorName }),
        ...(patch.amountCents !== undefined && { amount_cents: patch.amountCents }),
        ...(patch.paymentMethod !== undefined && { payment_method: patch.paymentMethod }),
        ...(patch.notes !== undefined && { notes: patch.notes }),
      }).eq('id', id).select(EXPENSE_SELECT).single(),
    )
    return toExpense(row)
  },

  async deleteExpense(id: Uuid) {
    const { error } = await db().from('expenses').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async listVendors() {
    const rows = unwrap(
      await db().from('vendors').select('*')
        .order('usage_count', { ascending: false }).order('name'),
    )
    return rows.map(toVendor)
  },

  async createVendor(categoryKey: ExpenseCategoryKey, name: string) {
    const row = unwrap(
      await db().from('vendors')
        .upsert({ category_key: categoryKey, name: name.trim(), is_archived: false },
          { onConflict: 'category_key,name' })
        .select().single(),
    )
    return toVendor(row)
  },

  async setVendorArchived(id: Uuid, archived: boolean) {
    const { error } = await db().from('vendors').update({ is_archived: archived }).eq('id', id)
    if (error) throw new Error(error.message)
  },

  /* ------------------------------------------------------------- students */
  async listClasses() {
    const rows = unwrap(await db().from('classes').select('*').order('sort_order').order('name'))
    return rows.map((r: any): SchoolClass => ({ id: r.id, name: r.name, sortOrder: r.sort_order }))
  },

  async createClass(name: string) {
    const row = unwrap(
      await db().from('classes').insert({ name: name.trim(), sort_order: 100 }).select().single(),
    )
    return { id: row.id, name: row.name, sortOrder: row.sort_order }
  },

  async deleteClass(id: Uuid) {
    const { error } = await db().from('classes').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async listStudents() {
    const rows = unwrap(
      await db().from('students').select('*, classes(name)')
        .order('first_name').order('last_name'),
    )
    return rows.map(toStudent)
  },

  async createStudent(draft: StudentDraft) {
    const row = unwrap(
      await db().from('students').insert({
        first_name: draft.firstName,
        last_name: draft.lastName,
        date_of_birth: draft.dateOfBirth,
        photo_url: draft.photoUrl,
        class_id: draft.classId,
        enrollment_date: draft.enrollmentDate,
        status: draft.status,
        emergency_contact_name: draft.emergencyContactName,
        emergency_contact_phone: draft.emergencyContactPhone,
        allergies: draft.allergies,
        medical_notes: draft.medicalNotes,
      }).select('*, classes(name)').single(),
    )
    return toStudent(row)
  },

  async updateStudent(id: Uuid, patch: Partial<StudentDraft>) {
    const row = unwrap(
      await db().from('students').update({
        ...(patch.firstName !== undefined && { first_name: patch.firstName }),
        ...(patch.lastName !== undefined && { last_name: patch.lastName }),
        ...(patch.dateOfBirth !== undefined && { date_of_birth: patch.dateOfBirth }),
        ...(patch.photoUrl !== undefined && { photo_url: patch.photoUrl }),
        ...(patch.classId !== undefined && { class_id: patch.classId }),
        ...(patch.enrollmentDate !== undefined && { enrollment_date: patch.enrollmentDate }),
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.emergencyContactName !== undefined && { emergency_contact_name: patch.emergencyContactName }),
        ...(patch.emergencyContactPhone !== undefined && { emergency_contact_phone: patch.emergencyContactPhone }),
        ...(patch.allergies !== undefined && { allergies: patch.allergies }),
        ...(patch.medicalNotes !== undefined && { medical_notes: patch.medicalNotes }),
      }).eq('id', id).select('*, classes(name)').single(),
    )
    return toStudent(row)
  },

  async deleteStudent(id: Uuid) {
    const { error } = await db().from('students').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async uploadStudentPhoto(studentId: Uuid, file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${studentId}/${Date.now()}.${ext}`
    const { error } = await db().storage.from('student-photos')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (error) throw new Error(error.message)
    return db().storage.from('student-photos').getPublicUrl(path).data.publicUrl
  },

  /* -------------------------------------------------------------- parents */
  async listParents() {
    const rows = unwrap(await db().from('parents').select('*').order('full_name'))
    return rows.map(toParent)
  },

  async createParent(draft: ParentDraft) {
    const row = unwrap(
      await db().from('parents')
        .insert({ full_name: draft.fullName, phone: draft.phone, email: draft.email })
        .select().single(),
    )
    return toParent(row)
  },

  async updateParent(id: Uuid, patch: Partial<ParentDraft>) {
    const row = unwrap(
      await db().from('parents').update({
        ...(patch.fullName !== undefined && { full_name: patch.fullName }),
        ...(patch.phone !== undefined && { phone: patch.phone }),
        ...(patch.email !== undefined && { email: patch.email }),
      }).eq('id', id).select().single(),
    )
    return toParent(row)
  },

  async deleteParent(id: Uuid) {
    const { error } = await db().from('parents').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async listLinks() {
    const rows = unwrap(await db().from('student_parents').select('*'))
    return rows.map((r: any): StudentParentLink => ({
      studentId: r.student_id,
      parentId: r.parent_id,
      relationship: r.relationship,
      isPrimaryContact: r.is_primary_contact,
    }))
  },

  async linkParent(link: StudentParentLink) {
    const { error } = await db().from('student_parents').upsert({
      student_id: link.studentId,
      parent_id: link.parentId,
      relationship: link.relationship,
      is_primary_contact: link.isPrimaryContact,
    }, { onConflict: 'student_id,parent_id' })
    if (error) throw new Error(error.message)
  },

  async unlinkParent(studentId: Uuid, parentId: Uuid) {
    const { error } = await db().from('student_parents').delete()
      .eq('student_id', studentId).eq('parent_id', parentId)
    if (error) throw new Error(error.message)
  },

  async listParentNotes() {
    const rows = unwrap(
      await db().from('parent_notes').select(NOTE_SELECT)
        .order('note_date', { ascending: false }).order('created_at', { ascending: false }),
    )
    return rows.map(toNote)
  },

  async addParentNote(parentId: Uuid, body: string, noteDate: IsoDate) {
    const row = unwrap(
      await db().from('parent_notes')
        .insert({ parent_id: parentId, body: body.trim(), note_date: noteDate, created_by: await currentUserId() })
        .select(NOTE_SELECT).single(),
    )
    return toNote(row)
  },

  async deleteParentNote(id: Uuid) {
    const { error } = await db().from('parent_notes').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  /* ----------------------------------------------------------------- fees */
  async listTerms() {
    const rows = unwrap(await db().from('terms').select('*').order('start_date'))
    return rows.map(toTerm)
  },

  async createTerm(term: Omit<Term, 'id'>) {
    if (term.isCurrent) await db().from('terms').update({ is_current: false }).eq('is_current', true)
    const row = unwrap(
      await db().from('terms').insert({
        name: term.name, start_date: term.startDate, end_date: term.endDate, is_current: term.isCurrent,
      }).select().single(),
    )
    return toTerm(row)
  },

  async updateTerm(id: Uuid, patch: Partial<Omit<Term, 'id'>>) {
    // Only one term may be current; clear the old one before claiming the flag.
    if (patch.isCurrent) {
      await db().from('terms').update({ is_current: false }).eq('is_current', true).neq('id', id)
    }
    const row = unwrap(
      await db().from('terms').update({
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.startDate !== undefined && { start_date: patch.startDate }),
        ...(patch.endDate !== undefined && { end_date: patch.endDate }),
        ...(patch.isCurrent !== undefined && { is_current: patch.isCurrent }),
      }).eq('id', id).select().single(),
    )
    return toTerm(row)
  },

  async listInvoices() {
    const rows = unwrap(await db().from('fee_invoices').select('*'))
    return rows.map(toInvoice)
  },

  async upsertInvoice(input) {
    const row = unwrap(
      await db().from('fee_invoices').upsert({
        student_id: input.studentId,
        term_id: input.termId,
        amount_due_cents: input.amountDueCents,
        due_date: input.dueDate,
        notes: input.notes ?? null,
      }, { onConflict: 'student_id,term_id' }).select().single(),
    )
    return toInvoice(row)
  },

  async deleteInvoice(id: Uuid) {
    const { error } = await db().from('fee_invoices').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async listPayments() {
    const rows = unwrap(
      await db().from('fee_payments').select(PAYMENT_SELECT)
        .order('paid_on', { ascending: false }).order('created_at', { ascending: false }),
    )
    return rows.map(toPayment)
  },

  async createPayment(input) {
    const row = unwrap(
      await db().from('fee_payments').insert({
        student_id: input.studentId,
        term_id: input.termId,
        amount_cents: input.amountCents,
        paid_on: input.paidOn,
        method: input.method,
        reference: input.reference ?? null,
        notes: input.notes ?? null,
        created_by: await currentUserId(),
      }).select(PAYMENT_SELECT).single(),
    )
    return toPayment(row)
  },

  async deletePayment(id: Uuid) {
    const { error } = await db().from('fee_payments').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  /* ---------------------------------------------------------------- staff */
  async listStaff() {
    const rows = unwrap(await db().from('staff').select('*').order('full_name'))
    return rows.map(toStaff)
  },

  async createStaff(draft: Omit<StaffMember, 'id'>) {
    const row = unwrap(
      await db().from('staff').insert({
        full_name: draft.fullName,
        role_title: draft.roleTitle,
        phone: draft.phone,
        email: draft.email,
        start_date: draft.startDate,
        is_active: draft.isActive,
        annual_leave_days: draft.annualLeaveDays,
      }).select().single(),
    )
    return toStaff(row)
  },

  async updateStaff(id: Uuid, patch: Partial<Omit<StaffMember, 'id'>>) {
    const row = unwrap(
      await db().from('staff').update({
        ...(patch.fullName !== undefined && { full_name: patch.fullName }),
        ...(patch.roleTitle !== undefined && { role_title: patch.roleTitle }),
        ...(patch.phone !== undefined && { phone: patch.phone }),
        ...(patch.email !== undefined && { email: patch.email }),
        ...(patch.startDate !== undefined && { start_date: patch.startDate }),
        ...(patch.isActive !== undefined && { is_active: patch.isActive }),
        ...(patch.annualLeaveDays !== undefined && { annual_leave_days: patch.annualLeaveDays }),
      }).eq('id', id).select().single(),
    )
    return toStaff(row)
  },

  async deleteStaff(id: Uuid) {
    const { error } = await db().from('staff').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async listLeave() {
    const rows = unwrap(
      await db().from('leave_records').select('*').order('start_date', { ascending: false }),
    )
    return rows.map(toLeave)
  },

  async createLeave(input: {
    staffId: Uuid; type: LeaveType; startDate: IsoDate; endDate: IsoDate; notes?: string | null
  }) {
    const row = unwrap(
      await db().from('leave_records').insert({
        staff_id: input.staffId,
        type: input.type,
        start_date: input.startDate,
        end_date: input.endDate,
        notes: input.notes ?? null,
        created_by: await currentUserId(),
      }).select().single(),
    )
    return toLeave(row)
  },

  async deleteLeave(id: Uuid) {
    const { error } = await db().from('leave_records').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  /* -------------------------------------------------------------- people */
  async listProfiles() {
    const rows = unwrap(await db().from('profiles').select('*').order('full_name'))
    return rows.map((r: any): Profile => ({
      id: r.id, fullName: r.full_name, email: r.email, role: r.role, createdAt: r.created_at,
    }))
  },

  async updateProfileRole(id: Uuid, role: Role) {
    const { error } = await db().from('profiles').update({ role }).eq('id', id)
    if (error) throw new Error(error.message)
  },
}
