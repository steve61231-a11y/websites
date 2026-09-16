import type { Role } from '@/data/types'

/**
 * What each role may do. The UI reads this to decide what to render; the
 * database enforces the same rules in RLS. Both exist on purpose — hiding a
 * button is a courtesy, the policy is the actual boundary.
 *
 * Roles are deliberately coarse (there are two people using this system today).
 * Adding a third role is a matter of adding a row to ROLE_CAPABILITIES.
 */
export const CAPABILITIES = [
  'expenses.view',
  'expenses.create',
  'expenses.edit',
  'expenses.delete',
  /** Salary rows are money conversations, not day-to-day admin. */
  'expenses.viewSalaries',

  'students.view',
  'students.manage',

  'parents.view',
  'parents.manage',

  'fees.view',
  'fees.recordPayment',
  /** Deciding what a family owes is the director's call. */
  'fees.setInvoice',

  'staff.view',
  'staff.logLeave',
  'staff.manageRegister',

  'settings.manageLists',
  'settings.manageUsers',
] as const

export type Capability = (typeof CAPABILITIES)[number]

const STAFF_CAPABILITIES: Capability[] = [
  'expenses.view', 'expenses.create', 'expenses.edit',
  'students.view', 'students.manage',
  'parents.view', 'parents.manage',
  'fees.view', 'fees.recordPayment',
  'staff.view', 'staff.logLeave',
]

const ROLE_CAPABILITIES: Record<Role, ReadonlySet<Capability>> = {
  admin: new Set(CAPABILITIES),
  staff: new Set(STAFF_CAPABILITIES),
}

export function roleCan(role: Role | null | undefined, capability: Capability): boolean {
  if (!role) return false
  return ROLE_CAPABILITIES[role].has(capability)
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  staff: 'Staff',
}

export const ROLE_DESCRIPTION: Record<Role, string> = {
  admin: 'Sees everything, including salaries and fee amounts. Can manage users.',
  staff: 'Day-to-day work: expenses, students, parents, fee payments and leave. Salary figures are hidden.',
}
