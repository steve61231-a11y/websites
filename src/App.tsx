import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/auth/AuthProvider'
import { LoginPage } from '@/auth/LoginPage'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/ui/Toast'
import { DashboardPage } from '@/modules/dashboard/DashboardPage'
import { LogoMark } from '@/brand/Logo'
import { CardSkeleton } from '@/components/ui/primitives'
import type { Capability } from '@/auth/permissions'

const ExpensesPage = lazy(() => import('@/modules/expenses/ExpensesPage'))
const AddExpensePage = lazy(() => import('@/modules/expenses/AddExpensePage'))
const StudentsPage = lazy(() => import('@/modules/students/StudentsPage'))
const StudentProfilePage = lazy(() => import('@/modules/students/StudentProfilePage'))
const ParentsPage = lazy(() => import('@/modules/parents/ParentsPage'))
const ParentProfilePage = lazy(() => import('@/modules/parents/ParentProfilePage'))
const FeesPage = lazy(() => import('@/modules/fees/FeesPage'))
const StaffPage = lazy(() => import('@/modules/staff/StaffPage'))
const SettingsPage = lazy(() => import('@/modules/settings/SettingsPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Gate />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

function Gate() {
  const { ready, profile } = useAuth()

  if (!ready) return <Splash />
  if (!profile) return <LoginPage />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="expenses" element={<Page cap="expenses.view"><ExpensesPage /></Page>} />
        <Route path="expenses/new" element={<Page cap="expenses.create"><AddExpensePage /></Page>} />
        <Route path="students" element={<Page cap="students.view"><StudentsPage /></Page>} />
        <Route path="students/:id" element={<Page cap="students.view"><StudentProfilePage /></Page>} />
        <Route path="parents" element={<Page cap="parents.view"><ParentsPage /></Page>} />
        <Route path="parents/:id" element={<Page cap="parents.view"><ParentProfilePage /></Page>} />
        <Route path="fees" element={<Page cap="fees.view"><FeesPage /></Page>} />
        <Route path="staff" element={<Page cap="staff.view"><StaffPage /></Page>} />
        <Route path="settings" element={<Page cap="settings.manageLists"><SettingsPage /></Page>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

/** Route guard + lazy-loading boundary in one small wrapper. */
function Page({ cap, children }: { cap: Capability; children: React.ReactNode }) {
  const { can } = useAuth()
  if (!can(cap)) return <NoAccess />
  return (
    <Suspense fallback={<div className="space-y-4"><CardSkeleton rows={2} /><CardSkeleton rows={4} /></div>}>
      {children}
    </Suspense>
  )
}

function NoAccess() {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-blob bg-sand-100 text-3xl">🔒</div>
      <h1 className="mt-4 font-display text-xl font-extrabold text-sand-900">That part is admin-only</h1>
      <p className="mt-2 text-[0.95rem] text-sand-500">
        Ask the school director to give your account access if you need it.
      </p>
    </div>
  )
}

function Splash() {
  return (
    <div className="grid min-h-[100dvh] place-items-center">
      <div className="flex flex-col items-center gap-4">
        <LogoMark className="h-16 w-16" animate />
        <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-sand-400">Iris Fields</p>
      </div>
    </div>
  )
}
