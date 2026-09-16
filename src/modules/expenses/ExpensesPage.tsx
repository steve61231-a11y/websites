import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, Filter, Plus, TrendingDown, TrendingUp, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatKes, percentChange, sumCents } from '@/lib/money'
import { formatDate, todayIso } from '@/lib/dates'
import { downloadCsv } from '@/lib/csv'
import { useCountUp } from '@/lib/useCountUp'
import { useExpenses } from '@/data/queries'
import {
  categoryBreakdown, filterByRange, spendTrend, vendorBreakdown,
} from '@/data/selectors'
import { CATEGORY_LIST, categoryToken, paymentMethodLabel, PAYMENT_METHODS } from '@/brand/categories'
import { PageHeader } from '@/components/layout/PageHeader'
import { Segmented } from '@/components/ui/Segmented'
import { Button, Fab } from '@/components/ui/Button'
import { CardSkeleton, EmptyState, Pill, SectionTitle } from '@/components/ui/primitives'
import { SearchInput } from '@/components/ui/fields'
import { CategoryDonut } from '@/components/charts/CategoryDonut'
import { TrendBars } from '@/components/charts/TrendBars'
import { ExpenseList } from './ExpenseList'
import { PERIOD_OPTIONS, usePeriod } from './usePeriod'
import { useAuth } from '@/auth/AuthProvider'
import type { ExpenseCategoryKey, PaymentMethod } from '@/data/types'

/**
 * The page the school actually looks at. Reading order is deliberate:
 * the one big number, then where it went, then when it went, then — last —
 * the row-by-row list for when somebody needs to check a specific entry.
 */
export default function ExpensesPage() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const { data: expenses, isLoading } = useExpenses()
  const period = usePeriod('month')

  const [category, setCategory] = useState<ExpenseCategoryKey | null>(null)
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const all = expenses ?? []

  const inPeriod = useMemo(() => filterByRange(all, period.range), [all, period.range])
  const inPrevious = useMemo(() => filterByRange(all, period.previous), [all, period.previous])

  const total = useMemo(() => sumCents(inPeriod.map((e) => e.amountCents)), [inPeriod])
  const previousTotal = useMemo(() => sumCents(inPrevious.map((e) => e.amountCents)), [inPrevious])
  const change = percentChange(total, previousTotal)
  const animatedTotal = useCountUp(total)

  const slices = useMemo(() => categoryBreakdown(inPeriod), [inPeriod])
  const trend = useMemo(
    () => spendTrend(category ? inPeriod.filter((e) => e.categoryKey === category) : inPeriod, period.range),
    [inPeriod, period.range, category],
  )
  const topVendors = useMemo(() => vendorBreakdown(inPeriod, 5), [inPeriod])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return inPeriod.filter((e) => {
      if (category && e.categoryKey !== category) return false
      if (method && e.paymentMethod !== method) return false
      if (!q) return true
      return (
        e.vendorName.toLowerCase().includes(q) ||
        (e.notes ?? '').toLowerCase().includes(q) ||
        categoryToken(e.categoryKey).label.toLowerCase().includes(q)
      )
    })
  }, [inPeriod, category, method, search])

  const activeFilterCount = (category ? 1 : 0) + (method ? 1 : 0)

  function exportCsv() {
    downloadCsv(`iris-fields-expenses-${period.range.from}-to-${period.range.to}`, filtered, [
      { header: 'Date', value: (e) => e.date },
      { header: 'Category', value: (e) => categoryToken(e.categoryKey).label },
      { header: 'Custom category', value: (e) => e.customCategory ?? '' },
      { header: 'Paid to', value: (e) => e.vendorName },
      { header: 'Amount (KES)', value: (e) => (e.amountCents / 100).toFixed(2) },
      { header: 'Payment method', value: (e) => paymentMethodLabel(e.paymentMethod) },
      { header: 'Note', value: (e) => e.notes ?? '' },
      { header: 'Logged by', value: (e) => e.createdByName ?? '' },
    ])
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton rows={1} />
        <CardSkeleton rows={4} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        emoji="💰"
        subtitle="Everything the school spends, in one place."
        action={
          can('expenses.create') ? (
            <Button
              className="hidden lg:inline-flex"
              icon={<Plus className="h-5 w-5" />}
              onClick={() => navigate('/expenses/new')}
            >
              Add Expense
            </Button>
          ) : undefined
        }
      />

      <Segmented
        ariaLabel="Period"
        options={PERIOD_OPTIONS}
        value={period.key}
        onChange={period.setKey}
      />

      {period.key === 'custom' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="card flex flex-wrap items-end gap-3 p-4"
        >
          <label className="flex-1 text-sm font-extrabold text-sand-700">
            From
            <input
              type="date"
              value={period.custom.from}
              max={period.custom.to}
              onChange={(e) => period.setCustom({ ...period.custom, from: e.target.value })}
              className="mt-1.5 h-12 w-full rounded-2xl border-2 border-sand-200 px-3 font-semibold focus:border-iris-400 focus:outline-none"
            />
          </label>
          <label className="flex-1 text-sm font-extrabold text-sand-700">
            To
            <input
              type="date"
              value={period.custom.to}
              min={period.custom.from}
              max={todayIso()}
              onChange={(e) => period.setCustom({ ...period.custom, to: e.target.value })}
              className="mt-1.5 h-12 w-full rounded-2xl border-2 border-sand-200 px-3 font-semibold focus:border-iris-400 focus:outline-none"
            />
          </label>
        </motion.div>
      )}

      {/* ---------------------------------------------------------- hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-blob bg-gradient-to-br from-iris-600 via-iris-500 to-sky-500 px-6 py-8 text-white shadow-glow"
      >
        <span
          aria-hidden="true"
          className="absolute -right-10 -top-10 h-44 w-44 rounded-blob bg-white/10"
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-16 -left-8 h-40 w-40 rounded-blob bg-gold-400/20"
        />
        <div className="relative">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-white/70">
            Total spent {period.range.label}
          </p>
          <p className="tnum mt-2 font-display text-[clamp(2.4rem,11vw,3.6rem)] font-extrabold leading-none">
            {formatKes(Math.round(animatedTotal))}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-white/85">
            {change !== null && Math.abs(change) >= 0.5 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
                {change > 0 ? (
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-4 w-4" aria-hidden="true" />
                )}
                {Math.abs(Math.round(change))}% vs {period.previous.label}
              </span>
            ) : previousTotal > 0 ? (
              <span className="rounded-full bg-white/15 px-3 py-1">About the same as {period.previous.label}</span>
            ) : null}
            <span>
              {inPeriod.length} {inPeriod.length === 1 ? 'entry' : 'entries'} ·{' '}
              {formatDate(period.range.from, 'short')} – {formatDate(period.range.to, 'short')}
            </span>
          </div>
        </div>
      </motion.section>

      {inPeriod.length === 0 ? (
        <EmptyState
          emoji="🧾"
          title={`Nothing recorded ${period.range.label}`}
          body="When you pay for something — shopping, fuel, a repair — log it here and it will show up in these charts straight away."
          action={
            can('expenses.create') ? (
              <Button size="lg" icon={<Plus className="h-5 w-5" />} onClick={() => navigate('/expenses/new')}>
                Add the first expense
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* --------------------------------------------------- breakdown */}
          <section className="card">
            <SectionTitle hint="Tap a slice to filter the list below">Where it went</SectionTitle>
            <CategoryDonut
              slices={slices}
              totalCents={total}
              selected={category}
              onSelect={setCategory}
            />
          </section>

          {/* ------------------------------------------------------- trend */}
          <section className="card">
            <SectionTitle
              hint={category ? `${categoryToken(category).label} only` : 'All categories'}
            >
              When it went out
            </SectionTitle>
            <TrendBars
              points={trend}
              color={category ? categoryToken(category).color : '#665EC7'}
            />
          </section>

          {/* ------------------------------------------------ top vendors */}
          {topVendors.length > 1 && (
            <section className="card">
              <SectionTitle hint={`Biggest ${period.range.label}`}>Who you paid most</SectionTitle>
              <ul className="space-y-2.5">
                {topVendors.map((vendor, i) => {
                  const share = total === 0 ? 0 : vendor.totalCents / topVendors[0].totalCents
                  return (
                    <li key={vendor.name}>
                      <div className="mb-1 flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm font-extrabold text-sand-800">{vendor.name}</span>
                        <span className="tnum shrink-0 text-sm font-extrabold text-sand-900">
                          {formatKes(vendor.totalCents, { prefix: false })}
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-sand-100">
                        <motion.div
                          className="h-full rounded-full bg-iris-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(share * 100, 4)}%` }}
                          transition={{ delay: 0.08 * i, duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* -------------------------------------------------- detail list */}
          <section>
            <SectionTitle
              hint={`${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'}`}
              action={
                <Button size="sm" variant="soft" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>
                  Export
                </Button>
              }
            >
              Every entry
            </SectionTitle>

            <div className="mb-3 space-y-3">
              <div className="flex gap-2">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search a shop, a note…"
                  className="flex-1"
                />
                <button
                  onClick={() => setFiltersOpen((v) => !v)}
                  aria-label="Filters"
                  className={cn(
                    'relative grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl border-2 transition-colors',
                    filtersOpen || activeFilterCount > 0
                      ? 'border-iris-400 bg-iris-50 text-iris-600'
                      : 'border-sand-200 bg-white text-sand-500',
                  )}
                >
                  <Filter className="h-5 w-5" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-iris-500 text-[0.65rem] font-extrabold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {category && (
                    <FilterChip
                      label={categoryToken(category).label}
                      color={categoryToken(category).color}
                      onClear={() => setCategory(null)}
                    />
                  )}
                  {method && (
                    <FilterChip label={paymentMethodLabel(method)} onClear={() => setMethod(null)} />
                  )}
                </div>
              )}

              {filtersOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card space-y-4 p-4"
                >
                  <div>
                    <p className="mb-2 text-sm font-extrabold text-sand-700">Category</p>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORY_LIST.map((token) => (
                        <button
                          key={token.key}
                          onClick={() => setCategory(category === token.key ? null : token.key)}
                          style={
                            category === token.key
                              ? { backgroundColor: token.color, borderColor: token.color }
                              : undefined
                          }
                          className={cn(
                            'flex min-h-[40px] items-center gap-1.5 rounded-xl border-2 px-3 text-sm font-extrabold transition-colors',
                            category === token.key
                              ? 'text-white'
                              : 'border-sand-200 bg-white text-sand-600 hover:border-iris-300',
                          )}
                        >
                          <span aria-hidden="true">{token.emoji}</span>
                          {token.short}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-extrabold text-sand-700">Paid by</p>
                    <div className="flex flex-wrap gap-2">
                      {PAYMENT_METHODS.map((m) => (
                        <button
                          key={m.key}
                          onClick={() => setMethod(method === m.key ? null : m.key)}
                          className={cn(
                            'flex min-h-[40px] items-center gap-1.5 rounded-xl border-2 px-3 text-sm font-extrabold transition-colors',
                            method === m.key
                              ? 'border-iris-500 bg-iris-500 text-white'
                              : 'border-sand-200 bg-white text-sand-600 hover:border-iris-300',
                          )}
                        >
                          <span aria-hidden="true">{m.emoji}</span>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="font-display text-lg font-extrabold text-sand-800">No matches</p>
                <p className="mt-1 text-sm text-sand-500">Try clearing the filters or searching for something else.</p>
                <Button
                  variant="soft"
                  className="mt-4"
                  onClick={() => {
                    setCategory(null)
                    setMethod(null)
                    setSearch('')
                  }}
                >
                  Clear everything
                </Button>
              </div>
            ) : (
              <ExpenseList expenses={filtered} />
            )}
          </section>
        </>
      )}

      {can('expenses.create') && (
        <Fab
          label="Add Expense"
          icon={<Plus className="h-5 w-5" />}
          onClick={() => navigate('/expenses/new')}
          className="lg:hidden"
        />
      )}
    </div>
  )
}

function FilterChip({
  label, color, onClear,
}: { label: string; color?: string; onClear: () => void }) {
  return (
    <Pill tone="iris" className="pr-1">
      {color && (
        <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      )}
      {label}
      <button
        onClick={onClear}
        aria-label={`Remove ${label} filter`}
        className="grid h-5 w-5 place-items-center rounded-full hover:bg-iris-200"
      >
        <X className="h-3 w-3" />
      </button>
    </Pill>
  )
}
