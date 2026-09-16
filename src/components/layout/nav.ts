import { Home, Wallet, Users, GraduationCap, HeartHandshake, CalendarDays, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Capability } from '@/auth/permissions'

export type NavItem = {
  to: string
  label: string
  /** Even shorter, for the bottom tab bar where space is measured in millimetres. */
  tab: string
  icon: LucideIcon
  emoji: string
  capability: Capability
  /** Shown in the bottom bar on phones, rather than behind "More". */
  primary?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', tab: 'Home', icon: Home, emoji: '🏠', capability: 'expenses.view', primary: true },
  { to: '/expenses', label: 'Expenses', tab: 'Expenses', icon: Wallet, emoji: '💰', capability: 'expenses.view', primary: true },
  { to: '/students', label: 'Students', tab: 'Students', icon: GraduationCap, emoji: '👨‍👩‍👧‍👦', capability: 'students.view', primary: true },
  { to: '/fees', label: 'School Fees', tab: 'Fees', icon: Wallet, emoji: '🏫', capability: 'fees.view', primary: true },
  { to: '/parents', label: 'Parents', tab: 'Parents', icon: HeartHandshake, emoji: '👪', capability: 'parents.view' },
  { to: '/staff', label: 'Staff Leave', tab: 'Staff', icon: CalendarDays, emoji: '🗓️', capability: 'staff.view' },
  { to: '/settings', label: 'Settings', tab: 'Settings', icon: Settings, emoji: '⚙️', capability: 'settings.manageLists' },
]

export const SECONDARY_ICON = Users
