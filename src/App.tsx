import { useEffect } from 'react'
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/auth/AuthProvider'
import { LoginPage } from '@/auth/LoginPage'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/ui/Toast'
import { DashboardPage } from '@/modules/dashboard/DashboardPage'
import { LogoMark } from '@/brand/Logo'
import { LazyRoute, lazyPage } from '@/components/layout/LazyRoute'
import type { Capability } from '@/auth/permissions'

/**
 * Every page, as a loader that can be both rendered lazily and fetched ahead of
 * time. Splitting them keeps the first screen small; prefetching them the
 * moment the app is idle means that, by the time anyone taps a section, the
 * code is already in the browser and it opens instantly instead of sitting on
 * a skeleton while a phone on mobile data fetches it.
 */
const PAGES = {
  expenses: () => import('@/modules/expenses/ExpensesPage'),
  addExpense: () => import('@/modules/expenses/AddExpensePage'),
  students: () => import('@/modules/students/StudentsPage'),
  studentProfile: () => import('@/modules/students/StudentProfilePage'),
  parents: () => import('@/modules/parents/ParentsPage'),
  parentProfile: () => import('@/modules/parents/ParentProfilePage'),
  fees: () => import('@/modules/fees/FeesPage'),
  staff: () => import('@/modules/staff/StaffPage'),
  settings: () => import('@/modules/settings/SettingsPage'),
  termReport: () => import('@/modules/reports/TermReportPage'),
}

const ExpensesPage = lazyPage(PAGES.expenses)
const AddExpensePage = lazyPage(PAGES.addExpense)
const StudentsPage = lazyPage(PAGES.students)
const StudentProfilePage = lazyPage(PAGES.studentProfile)
const ParentsPage = lazyPage(PAGES.parents)
const ParentProfilePage = lazyPage(PAGES.parentProfile)
const FeesPage = lazyPage(PAGES.fees)
const StaffPage = lazyPage(PAGES.staff)
const SettingsPage = lazyPage(PAGES.settings)
const TermReportPage = lazyPage(PAGES.termReport)

/** Pull every page into the browser once the app has settled. */
function usePrefetchPages(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const warm = () => {
      for (const load of Object.values(PAGES)) {
        if (cancelled) return
        // A failure here is not worth surfacing: the page will simply be
        // fetched again, with its own retry, when the user actually opens it.
        void load().catch(() => {})
      }
    }
    // requestIdleCallback is missing on older Safari, which is plenty of phones.
    const hasIdle = 'requestIdleCallback' in window
    const handle = hasIdle
      ? window.requestIdleCallback(warm, { timeout: 3000 })
      : window.setTimeout(warm, 1200)
    return () => {
      cancelled = true
      if (hasIdle) window.cancelIdleCallback(handle)
      else window.clearTimeout(handle)
    }
  }, [enabled])
}

/**
 * Clean URLs (/expenses) need a server that rewrites every path to index.html.
 * On plain static hosting — a preview link, GitHub Pages, an object store —
 * there is no such server, so a refresh on a deep link 404s. Building with
 * VITE_ROUTER=hash switches to /#/expenses, which any static host can serve.
 */
const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter

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
          <Router>
            <Gate />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

function Gate() {
  const { ready, profile } = useAuth()
  // Only once someone is actually in — no point spending a signed-out
  // visitor's data on pages they cannot open.
  usePrefetchPages(ready && profile !== null)

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
        <Route path="summary" element={<Page cap="reports.view"><TermReportPage /></Page>} />
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
  return <LazyRoute>{children}</LazyRoute>
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
