import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import {
  useExpenses, useInvoices, useLeave, useParents, usePayments, useStaff, useStudents, useTerms,
} from '@/data/queries'
import {
  currentTerm, feeBalancesForTerm, onLeaveOn, fullName,
} from '@/data/selectors'
import { formatKes, percentChange, sumCents } from '@/lib/money'
import {
  addDays, addMonths, endOfMonth, formatDate, greeting, isWithin, startOfMonth, todayIso,
} from '@/lib/dates'
import { cn } from '@/lib/cn'
import { CardSkeleton, StaggerItem, StaggerList } from '@/components/ui/primitives'
import { useCountUp } from '@/lib/useCountUp'
import { categoryToken } from '@/brand/categories'

const LEAVE_LABEL: Record<string, string> = {
  annual: 'Annual leave',
  sick: 'Sick day',
  other: 'Other leave',
}

/** "Agnes and Kevin", not "Agnes, Kevin" — this is a sentence, not a data field. */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/**
 * The first screen after signing in. It answers "what is going on today?" in
 * one glance and then gets out of the way — each card is a door into a module.
 */
export function DashboardPage() {
  const { profile, can } = useAuth()
  const today = todayIso()

  const expenses = useExpenses()
  const students = useStudents()
  const parents = useParents()
  const staff = useStaff()
  const leave = useLeave()
  const terms = useTerms()
  const invoices = useInvoices()
  const payments = usePayments()

  const loading =
    expenses.isLoading || students.isLoading || terms.isLoading || invoices.isLoading

  const stats = useMemo(() => {
    const allExpenses = expenses.data ?? []
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)
    // Compare like with like: the 1st–16th of last month, not the whole of it.
    // Otherwise a mid-month dashboard always reports a dramatic "drop".
    const prevStart = startOfMonth(addMonths(today, -1))
    const sameDayLastMonth = addDays(prevStart, Number(today.slice(8, 10)) - 1)
    const lastMonthEnd = endOfMonth(prevStart)
    const prevEnd = sameDayLastMonth < lastMonthEnd ? sameDayLastMonth : lastMonthEnd

    const thisMonth = sumCents(
      allExpenses.filter((e) => isWithin(e.date, monthStart, monthEnd)).map((e) => e.amountCents),
    )
    const lastMonth = sumCents(
      allExpenses.filter((e) => isWithin(e.date, prevStart, prevEnd)).map((e) => e.amountCents),
    )

    const term = currentTerm(terms.data ?? [])
    const balances = feeBalancesForTerm(
      (students.data ?? []).filter((s) => s.status === 'active'),
      term?.id ?? null,
      invoices.data ?? [],
      payments.data ?? [],
      today,
    )
    const outstanding = sumCents(
      [...balances.values()].map((b) => Math.max(b.balanceCents, 0)),
    )
    const overdueCount = [...balances.values()].filter((b) => b.status === 'overdue').length

    const activeStudents = (students.data ?? []).filter((s) => s.status === 'active')
    const onLeaveToday = onLeaveOn(leave.data ?? [], today)

    return {
      thisMonth,
      change: percentChange(thisMonth, lastMonth),
      activeStudents: activeStudents.length,
      families: (parents.data ?? []).length,
      outstanding,
      overdueCount,
      onLeaveToday,
      term,
    }
  }, [expenses.data, students.data, parents.data, leave.data, terms.data, invoices.data, payments.data, today])

  if (loading) {
    return (
      <div className="space-y-4">
        <CardSkeleton rows={2} />
        <div className="grid gap-4 sm:grid-cols-2">
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
        </div>
      </div>
    )
  }

  const firstName = (profile?.fullName ?? 'there').split(' ')[0]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-sand-400">
          {formatDate(today, 'long')}
        </p>
        <h1 className="mt-1.5 font-display text-[1.8rem] font-extrabold leading-tight text-sand-900 sm:text-[2.2rem]">
          {greeting()},{' '}
          <span className="whitespace-nowrap">
            {firstName} <span className="inline-block animate-pop-in">👋</span>
          </span>
        </h1>
        {stats.term && (
          <p className="mt-1 text-[0.95rem] text-sand-500">
            {stats.term.name} · {formatDate(stats.term.startDate, 'short')} – {formatDate(stats.term.endDate, 'short')}
          </p>
        )}
      </motion.div>

      <TodayStrip
        onLeave={stats.onLeaveToday.map((r) => {
          const member = (staff.data ?? []).find((m) => m.id === r.staffId)
          return { id: r.id, name: member?.fullName ?? 'A staff member', type: LEAVE_LABEL[r.type] }
        })}
        overdueCount={stats.overdueCount}
        canSeeFees={can('fees.view')}
      />

      <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" delay={0.05}>
        {can('expenses.view') && (
          <ModuleCard
            to="/expenses"
            emoji="💰"
            title="Expenses"
            accent="#665EC7"
            value={formatKes(stats.thisMonth)}
            caption="spent this month"
            trend={stats.change}
            countUpTo={stats.thisMonth}
          />
        )}
        {can('students.view') && (
          <ModuleCard
            to="/students"
            emoji="👨‍👩‍👧‍👦"
            title="Students"
            accent="#00AEEF"
            value={String(stats.activeStudents)}
            caption={stats.activeStudents === 1 ? 'child enrolled' : 'children enrolled'}
          />
        )}
        {can('fees.view') && (
          <ModuleCard
            to="/fees"
            emoji="🏫"
            title="School Fees"
            accent="#E7BC2A"
            value={formatKes(stats.outstanding)}
            caption={stats.outstanding === 0 ? 'everyone is paid up 🎉' : 'still outstanding'}
            countUpTo={stats.outstanding}
            tone={stats.outstanding > 0 ? 'warn' : 'good'}
          />
        )}
        {can('staff.view') && (
          <ModuleCard
            to="/staff"
            emoji="🗓️"
            title="Staff Leave"
            accent="#1BAF7A"
            value={String(stats.onLeaveToday.length)}
            caption={stats.onLeaveToday.length === 1 ? 'person on leave today' : 'on leave today'}
          />
        )}
        {can('parents.view') && (
          <ModuleCard
            to="/parents"
            emoji="👪"
            title="Parents"
            accent="#C15FA8"
            value={String(stats.families)}
            caption={stats.families === 1 ? 'family' : 'families'}
          />
        )}

        <StaggerItem>
          <Link
            to="/expenses/new"
            className="group flex h-full min-h-[9.5rem] flex-col justify-between rounded-3xl border-2 border-dashed border-iris-200 bg-iris-50/50 p-5 transition-colors hover:border-iris-400 hover:bg-iris-50"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-iris-500 shadow-soft transition-transform duration-300 ease-bounce group-hover:rotate-90">
              <Plus className="h-6 w-6" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-display text-lg font-extrabold text-iris-700">Add an expense</span>
              <span className="mt-0.5 block text-sm text-iris-500">Takes about 20 seconds</span>
            </span>
          </Link>
        </StaggerItem>
      </StaggerList>

      {can('expenses.view') && <RecentActivity />}
    </div>
  )
}

/* ------------------------------------------------------------- module card */

function ModuleCard({
  to, emoji, title, value, caption, accent, trend, countUpTo, tone = 'ink',
}: {
  to: string
  emoji: string
  title: string
  value: string
  caption: string
  accent: string
  trend?: number | null
  countUpTo?: number
  tone?: 'ink' | 'good' | 'warn'
}) {
  // Money figures count up; plain counts (12 students) do not — a spinning
  // "12" reads as a glitch, a spinning "KES 45,200" reads as the page waking up.
  const animated = useCountUp(countUpTo ?? 0)
  const display = countUpTo !== undefined && countUpTo > 0 ? formatKes(Math.round(animated)) : value

  return (
    <StaggerItem className="h-full">
      <Link
        to={to}
        className="group relative flex h-full min-h-[9.5rem] flex-col justify-between overflow-hidden rounded-3xl border border-sand-200/80 bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
      >
        <span
          aria-hidden="true"
          className="absolute -right-6 -top-6 h-24 w-24 rounded-blob opacity-10 transition-transform duration-500 group-hover:scale-125"
          style={{ backgroundColor: accent }}
        />
        <span className="relative flex items-start justify-between gap-2">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sand-50 text-2xl">{emoji}</span>
          <ArrowUpRight className="h-5 w-5 text-sand-300 transition-colors group-hover:text-iris-500" aria-hidden="true" />
        </span>

        <span className="relative mt-4 block">
          <span className="block text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-sand-400">
            {title}
          </span>
          <span
            className={cn(
              'tnum mt-1 block font-display text-[clamp(1.5rem,5.5vw,2rem)] font-extrabold leading-none',
              tone === 'good' && 'text-good-ink',
              tone === 'warn' && 'text-sand-900',
              tone === 'ink' && 'text-sand-900',
            )}
          >
            {display}
          </span>
          <span className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-sand-500">
            {caption}
            {trend !== null && trend !== undefined && Math.abs(trend) >= 0.5 && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-extrabold',
                  trend > 0 ? 'text-bad-base' : 'text-good-base',
                )}
              >
                {trend > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {Math.abs(Math.round(trend))}%
              </span>
            )}
          </span>
        </span>
      </Link>
    </StaggerItem>
  )
}

/* -------------------------------------------------------------- today strip */

function TodayStrip({
  onLeave, overdueCount, canSeeFees,
}: {
  onLeave: Array<{ id: string; name: string; type: string }>
  overdueCount: number
  canSeeFees: boolean
}) {
  const items: Array<{ key: string; node: React.ReactNode }> = []

  if (onLeave.length > 0) {
    items.push({
      key: 'leave',
      node: (
        <Link to="/staff" className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft transition-shadow hover:shadow-lift">
          <span aria-hidden="true" className="text-xl">🗓️</span>
          <span className="min-w-0 text-sm">
            <span className="block font-extrabold text-sand-800">
              {joinNames(onLeave.map((l) => l.name.split(' ')[0]))} {onLeave.length === 1 ? 'is' : 'are'} off today
            </span>
            <span className="text-sand-500">{onLeave.map((l) => l.type).join(' · ')}</span>
          </span>
        </Link>
      ),
    })
  }

  if (canSeeFees && overdueCount > 0) {
    items.push({
      key: 'fees',
      node: (
        <Link to="/fees" className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft transition-shadow hover:shadow-lift">
          <span aria-hidden="true" className="text-xl">🏫</span>
          <span className="min-w-0 text-sm">
            <span className="block font-extrabold text-sand-800">
              {overdueCount} {overdueCount === 1 ? 'family is' : 'families are'} past the due date
            </span>
            <span className="text-sand-500">Tap to see who</span>
          </span>
        </Link>
      ),
    })
  }

  if (items.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="grid gap-3 sm:grid-cols-2"
    >
      {items.map((i) => (
        <div key={i.key}>{i.node}</div>
      ))}
    </motion.div>
  )
}

/* ----------------------------------------------------------- recent activity */

function RecentActivity() {
  const { data: expenses = [] } = useExpenses()
  const { data: payments = [] } = usePayments()
  const { data: students = [] } = useStudents()
  const { can } = useAuth()

  const feed = useMemo(() => {
    const expenseItems = expenses.slice(0, 6).map((e) => ({
      id: `e-${e.id}`,
      date: e.date,
      kind: 'out' as const,
      title: e.vendorName || categoryToken(e.categoryKey).label,
      subtitle: categoryToken(e.categoryKey).label,
      emoji: categoryToken(e.categoryKey).emoji,
      amountCents: e.amountCents,
    }))

    const paymentItems = can('fees.view')
      ? payments.slice(0, 6).map((p) => {
          const student = students.find((s) => s.id === p.studentId)
          return {
            id: `p-${p.id}`,
            date: p.paidOn,
            kind: 'in' as const,
            title: student ? fullName(student) : 'Fee payment',
            subtitle: 'School fees',
            emoji: '🏫',
            amountCents: p.amountCents,
          }
        })
      : []

    return [...expenseItems, ...paymentItems]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 7)
  }, [expenses, payments, students, can])

  if (feed.length === 0) return null

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-lg font-extrabold text-sand-900">Latest activity</h2>
        <Link to="/expenses" className="text-sm font-extrabold text-iris-600 hover:text-iris-700">
          See all
        </Link>
      </div>

      <StaggerList className="card divide-y divide-sand-100 overflow-hidden p-0">
        {feed.map((item) => (
          <StaggerItem key={item.id}>
            <div className="flex items-center gap-3.5 px-4 py-3.5">
              <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sand-50 text-lg">
                {item.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-sand-800">{item.title}</p>
                <p className="truncate text-sm text-sand-500">
                  {item.subtitle} · {formatDate(item.date, 'short')}
                </p>
              </div>
              <p
                className={cn(
                  'tnum shrink-0 font-display text-base font-extrabold',
                  item.kind === 'in' ? 'text-good-ink' : 'text-sand-800',
                )}
              >
                {item.kind === 'in' ? '+' : '−'}
                {formatKes(item.amountCents, { prefix: false })}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerList>
    </section>
  )
}
