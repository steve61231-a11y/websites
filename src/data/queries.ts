import {
  useMutation, useQuery, useQueryClient, type UseMutationOptions,
} from '@tanstack/react-query'
import { repo } from './index'
import type {
  Expense, ExpenseDraft, ExpenseCategoryKey, Student, StudentDraft, Parent, ParentDraft,
  StudentParentLink, Term, FeeItem, FeeChargeDraft, FeePayment, StaffMember,
  LeaveType, Role, Uuid,
} from './types'
import type { IsoDate } from '@/lib/dates'

/** One place for every cache key, so invalidation can never miss a screen. */
export const qk = {
  expenses: ['expenses'] as const,
  vendors: ['vendors'] as const,
  classes: ['classes'] as const,
  students: ['students'] as const,
  parents: ['parents'] as const,
  links: ['links'] as const,
  parentNotes: ['parent-notes'] as const,
  terms: ['terms'] as const,
  feeItems: ['fee-items'] as const,
  charges: ['charges'] as const,
  payments: ['payments'] as const,
  staff: ['staff'] as const,
  leave: ['leave'] as const,
  profiles: ['profiles'] as const,
}

const list = <T,>(key: readonly unknown[], fn: () => Promise<T>) =>
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useQuery({ queryKey: key, queryFn: fn, staleTime: 30_000 })

export const useExpenses = () => list(qk.expenses, () => repo.listExpenses())
export const useVendors = () => list(qk.vendors, () => repo.listVendors())
export const useClasses = () => list(qk.classes, () => repo.listClasses())
export const useStudents = () => list(qk.students, () => repo.listStudents())
export const useParents = () => list(qk.parents, () => repo.listParents())
export const useLinks = () => list(qk.links, () => repo.listLinks())
export const useParentNotes = () => list(qk.parentNotes, () => repo.listParentNotes())
export const useTerms = () => list(qk.terms, () => repo.listTerms())
export const useFeeItems = () => list(qk.feeItems, () => repo.listFeeItems())
export const useCharges = () => list(qk.charges, () => repo.listCharges())
export const usePayments = () => list(qk.payments, () => repo.listPayments())
export const useStaff = () => list(qk.staff, () => repo.listStaff())
export const useLeave = () => list(qk.leave, () => repo.listLeave())
export const useProfiles = () => list(qk.profiles, () => repo.listProfiles())

type MutationExtras<TData, TVars> = Omit<
  UseMutationOptions<TData, Error, TVars>, 'mutationFn'
>

/** Mutation helper that always refreshes the caches a change can touch. */
function useRepoMutation<TData, TVars>(
  mutationFn: (vars: TVars) => Promise<TData>,
  invalidates: ReadonlyArray<readonly unknown[]>,
  extras?: MutationExtras<TData, TVars>,
) {
  const qc = useQueryClient()
  return useMutation<TData, Error, TVars>({
    mutationFn,
    ...extras,
    onSuccess: (...args) => {
      invalidates.forEach((key) => void qc.invalidateQueries({ queryKey: key }))
      extras?.onSuccess?.(...args)
    },
  })
}

/* ---------------------------------------------------------------- expenses */

export const useCreateExpense = (extras?: MutationExtras<Expense, ExpenseDraft>) =>
  useRepoMutation((draft: ExpenseDraft) => repo.createExpense(draft), [qk.expenses, qk.vendors], extras)

export const useUpdateExpense = () =>
  useRepoMutation(
    ({ id, patch }: { id: Uuid; patch: Partial<ExpenseDraft> }) => repo.updateExpense(id, patch),
    [qk.expenses],
  )

export const useDeleteExpense = () =>
  useRepoMutation((id: Uuid) => repo.deleteExpense(id), [qk.expenses])

export const useCreateVendor = () =>
  useRepoMutation(
    ({ categoryKey, name }: { categoryKey: ExpenseCategoryKey; name: string }) =>
      repo.createVendor(categoryKey, name),
    [qk.vendors],
  )

export const useSetVendorArchived = () =>
  useRepoMutation(
    ({ id, archived }: { id: Uuid; archived: boolean }) => repo.setVendorArchived(id, archived),
    [qk.vendors],
  )

/* ---------------------------------------------------------------- students */

export const useCreateStudent = (extras?: MutationExtras<Student, StudentDraft>) =>
  useRepoMutation((draft: StudentDraft) => repo.createStudent(draft), [qk.students], extras)

export const useUpdateStudent = () =>
  useRepoMutation(
    ({ id, patch }: { id: Uuid; patch: Partial<StudentDraft> }) => repo.updateStudent(id, patch),
    [qk.students],
  )

export const useDeleteStudent = () =>
  useRepoMutation((id: Uuid) => repo.deleteStudent(id), [qk.students, qk.links, qk.charges, qk.payments])

export const useUploadStudentPhoto = () =>
  useRepoMutation(
    ({ studentId, file }: { studentId: Uuid; file: File }) => repo.uploadStudentPhoto(studentId, file),
    [qk.students],
  )

export const useCreateClass = () =>
  useRepoMutation((name: string) => repo.createClass(name), [qk.classes])

export const useDeleteClass = () =>
  useRepoMutation((id: Uuid) => repo.deleteClass(id), [qk.classes, qk.students])

/* ----------------------------------------------------------------- parents */

export const useCreateParent = (extras?: MutationExtras<Parent, ParentDraft>) =>
  useRepoMutation((draft: ParentDraft) => repo.createParent(draft), [qk.parents], extras)

export const useUpdateParent = () =>
  useRepoMutation(
    ({ id, patch }: { id: Uuid; patch: Partial<ParentDraft> }) => repo.updateParent(id, patch),
    [qk.parents],
  )

export const useDeleteParent = () =>
  useRepoMutation((id: Uuid) => repo.deleteParent(id), [qk.parents, qk.links, qk.parentNotes])

export const useLinkParent = () =>
  useRepoMutation((link: StudentParentLink) => repo.linkParent(link), [qk.links])

export const useUnlinkParent = () =>
  useRepoMutation(
    ({ studentId, parentId }: { studentId: Uuid; parentId: Uuid }) =>
      repo.unlinkParent(studentId, parentId),
    [qk.links],
  )

export const useAddParentNote = () =>
  useRepoMutation(
    ({ parentId, body, noteDate }: { parentId: Uuid; body: string; noteDate: IsoDate }) =>
      repo.addParentNote(parentId, body, noteDate),
    [qk.parentNotes],
  )

export const useDeleteParentNote = () =>
  useRepoMutation((id: Uuid) => repo.deleteParentNote(id), [qk.parentNotes])

/* -------------------------------------------------------------------- fees */

export const useCreateTerm = () =>
  useRepoMutation((term: Omit<Term, 'id'>) => repo.createTerm(term), [qk.terms])

export const useUpdateTerm = () =>
  useRepoMutation(
    ({ id, patch }: { id: Uuid; patch: Partial<Omit<Term, 'id'>> }) => repo.updateTerm(id, patch),
    [qk.terms],
  )

export const useUpsertFeeItem = () =>
  useRepoMutation((item: FeeItem) => repo.upsertFeeItem(item), [qk.feeItems])

export const useDeleteFeeItem = () =>
  useRepoMutation((key: string) => repo.deleteFeeItem(key), [qk.feeItems, qk.charges])

export const useCreateCharge = () =>
  useRepoMutation((draft: FeeChargeDraft) => repo.createCharge(draft), [qk.charges])

export const useCreateCharges = () =>
  useRepoMutation((drafts: FeeChargeDraft[]) => repo.createCharges(drafts), [qk.charges])

export const useUpdateCharge = () =>
  useRepoMutation(
    ({ id, patch }: { id: Uuid; patch: Partial<FeeChargeDraft> }) => repo.updateCharge(id, patch),
    [qk.charges],
  )

export const useDeleteCharge = () =>
  useRepoMutation((id: Uuid) => repo.deleteCharge(id), [qk.charges, qk.payments])

type PaymentInput = Omit<FeePayment, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>

export const useCreatePayment = (extras?: MutationExtras<FeePayment, PaymentInput>) =>
  useRepoMutation((input: PaymentInput) => repo.createPayment(input), [qk.payments, qk.charges], extras)

export const useDeletePayment = () =>
  useRepoMutation((id: Uuid) => repo.deletePayment(id), [qk.payments])

/* ------------------------------------------------------------------- staff */

export const useCreateStaff = () =>
  useRepoMutation((draft: Omit<StaffMember, 'id'>) => repo.createStaff(draft), [qk.staff])

export const useUpdateStaff = () =>
  useRepoMutation(
    ({ id, patch }: { id: Uuid; patch: Partial<Omit<StaffMember, 'id'>> }) => repo.updateStaff(id, patch),
    [qk.staff],
  )

export const useDeleteStaff = () =>
  useRepoMutation((id: Uuid) => repo.deleteStaff(id), [qk.staff, qk.leave])

export const useCreateLeave = () =>
  useRepoMutation(
    (input: { staffId: Uuid; type: LeaveType; startDate: IsoDate; endDate: IsoDate; notes?: string | null }) =>
      repo.createLeave(input),
    [qk.leave],
  )

export const useDeleteLeave = () =>
  useRepoMutation((id: Uuid) => repo.deleteLeave(id), [qk.leave])

/* ------------------------------------------------------------------ people */

export const useUpdateProfileRole = () =>
  useRepoMutation(
    ({ id, role }: { id: Uuid; role: Role }) => repo.updateProfileRole(id, role),
    [qk.profiles],
  )
