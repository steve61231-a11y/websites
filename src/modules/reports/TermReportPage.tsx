import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatKes, percentChange, sumCents } from '@/lib/money'
import { formatDate, isWithin, todayIso } from '@/lib/dates'
import { downloadCsv } from '@/lib/csv'
import { useCountUp } from '@/lib/useCountUp'
import {
  useCharges, useClasses, useExpenses, useFeeItems, usePayments, useStudents, useTerms,
} from '@/data/queries'
import { categoryBreakdown, currentTerm, feeBalancesForTerm, fullName } from '@/data/selectors'
import { categoryToken } from '@/brand/categories'
import { PageHeader } from '@/components/layout/PageHeader'
import { Segmented } from '@/components/ui/Segmented'
import { Button } from '@/components/ui/Button'
import { Avatar, CardSkeleton, EmptyState, Pill, SectionTitle } from '@/components/ui/primitives'
import { CategoryDonut } from '@/components/charts/CategoryDonut'
import type { ExpenseCategoryKey, Term } from '@/data/types'

const IN = '#17845A'
const OUT = '#B0730A'

/**
 * The director's one page.
 *
 * Not a pile of numbers — it answers, in order: did the school make money this
 * term, is it collecting what it bills, where is the money going, and what does
 * one child cost to teach. Everything else on it exists to support one of those
 * four questions.
 */
export default function TermReportPage() {
  const terms = useTerms()
  const students = useStudents()
  const classes = useClasses()
  const charges = useCharges()
  const payments = usePayments()
  const feeItems = useFeeItems()
  const expenses = useExpenses()

  const allTerms = terms.data ?? []
  const [termId, setTermId] = useState<string | null>(null)
  const term = termId ? allTerms.find((t) => t.id === termId) ?? null : currentTerm(allTerms)
  const previous = useMemo(() => previousTerm(allTerms, term), [allTerms, term])

  const roster = (students.data ?? []).filter((s) => s.status === 'active')

  const now = useMemo(() => summarise(term), [term, charges.data, payments.data, expenses.data, feeItems.data, roster.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const before = useMemo(() => summarise(previous), [previous, charges.data, payments.data, expenses.data, feeItems.data, roster.length]) // eslint-disable-line react-hooks/exhaustive-deps

  function summarise(forTerm: Term | null) {
    if (!forTerm) return null
    const within = (date: string) => isWithin(date, forTerm.startDate, forTerm.endDate)

    const termPayments = (payments.data ?? []).filter((p) => within(p.paidOn))
    const termExpenses = (expenses.data ?? []).filter((e) => within(e.date))

    const collected = sumCents(termPayments.map((p) => p.amountCents))
    const spent = sumCents(termExpenses.map((e) => e.amountCents))

    const balances = feeBalancesForTerm(
      roster, forTerm.id, charges.data ?? [], payments.data ?? [], feeItems.data ?? [], allTerms,
    )
    const billed = sumCents([...balances.values()].map((b) => b.dueCents))
    const outstanding = sumCents([...balances.values()].map((b) => b.balanceCents))

    // Money in, split by what it was paid against.
    const chargeById = new Map((charges.data ?? []).map((c) => [c.id, c]))
    const byItem = new Map<string, number>()
    for (const p of termPayments) {
      const key = p.chargeId ? chargeById.get(p.chargeId)?.itemKey ?? 'other' : 'other'
      byItem.set(key, (byItem.get(key) ?? 0) + p.amountCents)
    }

    return {
      term: forTerm,
      collected,
      spent,
      net: collected - spent,
      billed,
      outstanding,
      collectionRate: billed === 0 ? 0 : Math.min(collected / billed, 1),
      byItem: [...byItem.entries()]
        .map(([key, cents]) => ({
          key,
          label: (feeItems.data ?? []).find((i) => i.key === key)?.label ?? 'Unallocated',
          emoji: (feeItems.data ?? []).find((i) => i.key === key)?.emoji ?? '💰',
          cents,
        }))
        .sort((a, b) => b.cents - a.cents),
      expenseSlices: categoryBreakdown(termExpenses),
      balances,
      childCount: roster.length,
    }
  }

  const animatedNet = useCountUp(now?.net ?? 0)

  const loading = terms.isLoading || students.isLoading || charges.isLoading || expenses.isLoading
  if (loading) {
    return <div className="space-y-4"><CardSkeleton rows={2} /><CardSkeleton rows={4} /></div>
  }

  if (!term || !now) {
    return (
      <div className="space-y-5">
        <PageHeader title="Term Summary" emoji="📊" />
        <EmptyState
          emoji="📅"
          title="No term to summarise yet"
          body="Set up a term in Settings and this page will fill in on its own as fees come in and expenses go out."
          action={<Button onClick={() => { window.location.href = '/settings' }}>Go to Settings</Button>}
        />
      </div>
    )
  }

  // Averages are rounded to whole shillings: "KES 13,262.50 per child" reads as
  // false precision on a figure that is an average of twelve children.
  const perShilling = (cents: number) => Math.round(cents / 100) * 100
  const perChild = now.childCount === 0 ? 0 : perShilling(now.spent / now.childCount)
  const incomePerChild = now.childCount === 0 ? 0 : perShilling(now.collected / now.childCount)
  const netChange = before ? percentChange(now.net, before.net) : null

  const owing = [...now.balances.entries()]
    .map(([id, b]) => ({ student: roster.find((s) => s.id === id)!, balance: b }))
    .filter((r) => r.student && r.balance.balanceCents > 0)
    .sort((a, b) => b.balance.balanceCents - a.balance.balanceCents)

  function exportCsv() {
    if (!now) return
    downloadCsv(
      `iris-fields-${term!.name.replace(/\s+/g, '-').toLowerCase()}-summary`,
      [
        { line: 'Fees collected', amount: now.collected },
        { line: 'Expenses', amount: -now.spent },
        { line: 'Net', amount: now.net },
        { line: 'Billed this term', amount: now.billed },
        { line: 'Still outstanding', amount: now.outstanding },
        ...now.byItem.map((i) => ({ line: `Collected — ${i.label}`, amount: i.cents })),
        ...now.expenseSlices.map((sl) => ({
          line: `Spent — ${categoryToken(sl.key as ExpenseCategoryKey).label}`,
          amount: -sl.totalCents,
        })),
      ],
      [
        { header: 'Line', value: (r) => r.line },
        { header: 'Amount (KES)', value: (r) => (r.amount / 100).toFixed(2) },
      ],
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Term Summary"
        emoji="📊"
        subtitle={`${term.name} · ${formatDate(term.startDate, 'medium')} – ${formatDate(term.endDate, 'medium')}`}
        action={
          <Button variant="soft" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>
            <span className="hidden sm:inline">Export</span>
          </Button>
        }
      />

      {allTerms.length > 1 && (
        <Segmented
          ariaLabel="Term"
          size="sm"
          options={allTerms.map((t) => ({ value: t.id, label: t.name }))}
          value={term.id}
          onChange={setTermId}
        />
      )}

      {/* ---------------------------------------------- did we make money? */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative overflow-hidden rounded-blob px-6 py-8 text-white shadow-lift',
          now.net >= 0
            ? 'bg-gradient-to-br from-good-base to-[#1BAF7A]'
            : 'bg-gradient-to-br from-[#8E2A20] to-bad-base',
        )}
      >
        <span aria-hidden="true" className="absolute -right-10 -top-10 h-44 w-44 rounded-blob bg-white/10" />
        <div className="relative">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-white/75">
            {now.net >= 0 ? 'Ahead this term' : 'Behind this term'}
          </p>
          <p className="tnum mt-2 font-display text-[clamp(2.3rem,10vw,3.4rem)] font-extrabold leading-none">
            {formatKes(Math.abs(Math.round(animatedNet)))}
          </p>
          <p className="mt-3 text-[0.95rem] font-bold text-white/85">
            {formatKes(now.collected)} came in · {formatKes(now.spent)} went out
          </p>
          {netChange !== null && before && Math.abs(netChange) >= 1 && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
              {netChange > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(Math.round(netChange))}% vs {before.term.name}
            </span>
          )}
        </div>
      </motion.section>

      {/* ----------------------------------------------- the four questions */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Collected"
          value={formatKes(now.collected)}
          hint={`${Math.round(now.collectionRate * 100)}% of the ${formatKes(now.billed)} billed`}
          tone="good"
        />
        <Stat
          label="Still owed"
          value={formatKes(now.outstanding)}
          hint={owing.length === 0 ? 'Everyone is paid up 🎉' : `${owing.length} ${owing.length === 1 ? 'family' : 'families'}`}
          tone={now.outstanding > 0 ? 'bad' : 'good'}
        />
        <Stat
          label="Spent"
          value={formatKes(now.spent)}
          hint={`${formatKes(perChild)} per child`}
        />
        <Stat
          label="Income per child"
          value={formatKes(incomePerChild)}
          hint={
            incomePerChild > perChild
              ? `${formatKes(incomePerChild - perChild)} more than they cost`
              : `${formatKes(perChild - incomePerChild)} less than they cost`
          }
          tone={incomePerChild > perChild ? 'good' : 'bad'}
        />
      </div>

      {/* --------------------------------------------- in against out */}
      <section className="card">
        <SectionTitle hint={`Across ${term.name}`}>Money in against money out</SectionTitle>
        <div className="space-y-4">
          {[
            { label: 'Fees collected', cents: now.collected, color: IN },
            { label: 'Expenses', cents: now.spent, color: OUT },
          ].map((bar, i) => {
            const biggest = Math.max(now.collected, now.spent, 1)
            return (
              <div key={bar.label}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-extrabold text-sand-800">
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: bar.color }} />
                    {bar.label}
                  </span>
                  <span className="tnum shrink-0 font-display text-base font-extrabold text-sand-900">
                    {formatKes(bar.cents)}
                  </span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-sand-100">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: bar.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max((bar.cents / biggest) * 100, 2)}%` }}
                    transition={{ delay: 0.1 * i, duration: 0.7, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ------------------------------------------------- where it came from */}
      {now.byItem.length > 0 && (
        <section className="card">
          <SectionTitle hint="What parents actually paid for">Where the money came from</SectionTitle>
          <ul className="space-y-2.5">
            {now.byItem.map((item, i) => {
              const share = item.cents / Math.max(now.byItem[0].cents, 1)
              return (
                <li key={item.key}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2 truncate text-sm font-extrabold text-sand-800">
                      <span aria-hidden="true">{item.emoji}</span>
                      {item.label}
                    </span>
                    <span className="tnum shrink-0 text-sm font-extrabold text-sand-900">
                      {formatKes(item.cents, { prefix: false })}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-sand-100">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: IN }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(share * 100, 3)}%` }}
                      transition={{ delay: 0.06 * i, duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* ----------------------------------------------------- where it went */}
      {now.expenseSlices.length > 0 && (
        <section className="card">
          <SectionTitle hint={`${formatKes(now.spent)} across ${term.name}`}>Where it went</SectionTitle>
          <CategoryDonut
            slices={now.expenseSlices}
            totalCents={now.spent}
            selected={null}
            onSelect={() => {}}
          />
        </section>
      )}

      {/* ---------------------------------------------------------- the roll */}
      <section className="card">
        <SectionTitle hint={`${roster.length} children`}>Who is in the school</SectionTitle>
        <ul className="grid gap-2 sm:grid-cols-2">
          {(classes.data ?? []).map((c) => {
            const count = roster.filter((s) => s.classId === c.id).length
            return (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-2xl bg-sand-50 px-4 py-3">
                <span className="font-extrabold text-sand-800">{c.name}</span>
                <span className="tnum font-display text-lg font-extrabold text-sand-900">{count}</span>
              </li>
            )
          })}
        </ul>
      </section>

      {/* ------------------------------------------------------- who still owes */}
      {owing.length > 0 && (
        <section className="card">
          <SectionTitle hint="Largest first">Families still to pay</SectionTitle>
          <ul className="space-y-1.5">
            {owing.slice(0, 8).map(({ student, balance }) => (
              <li key={student.id}>
                <Link
                  to={`/students/${student.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-sand-50 p-3 transition-colors hover:bg-sand-100"
                >
                  <Avatar name={fullName(student)} src={student.photoUrl} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-extrabold text-sand-900">{fullName(student)}</span>
                    <span className="block truncate text-sm text-sand-500">{student.className ?? 'No class'}</span>
                  </span>
                  {balance.broughtForwardCents > 0 && (
                    <Pill tone="bad">incl. {formatKes(balance.broughtForwardCents, { prefix: false })} old</Pill>
                  )}
                  <span className="tnum shrink-0 font-display text-base font-extrabold text-sand-900">
                    {formatKes(balance.balanceCents, { prefix: false })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {owing.length > 8 && (
            <Link to="/fees" className="mt-3 block text-center text-sm font-extrabold text-iris-600">
              See all {owing.length} families
            </Link>
          )}
        </section>
      )}

      <p className="pb-2 text-center text-xs font-semibold text-sand-400">
        Figures cover {formatDate(term.startDate, 'medium')} – {formatDate(term.endDate, 'medium')}
        {term.endDate > todayIso() && ' · the term is still running'}
      </p>
    </div>
  )
}

function previousTerm(terms: readonly Term[], current: Term | null): Term | null {
  if (!current) return null
  return (
    [...terms]
      .filter((t) => t.startDate < current.startDate)
      .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))[0] ?? null
  )
}

function Stat({
  label, value, hint, tone = 'ink',
}: { label: string; value: string; hint: string; tone?: 'ink' | 'good' | 'bad' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4"
    >
      <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-sand-400">{label}</p>
      <p
        className={cn(
          'tnum mt-1.5 font-display text-[clamp(1.4rem,5vw,1.8rem)] font-extrabold leading-none',
          tone === 'good' && 'text-good-ink',
          tone === 'bad' && 'text-bad-ink',
          tone === 'ink' && 'text-sand-900',
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-sand-500">{hint}</p>
    </motion.div>
  )
}
