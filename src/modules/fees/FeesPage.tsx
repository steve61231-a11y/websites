import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, Plus, Receipt, Settings2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatKes, sumCents } from '@/lib/money'
import { formatDate, todayIso } from '@/lib/dates'
import { downloadCsv } from '@/lib/csv'
import { useCountUp } from '@/lib/useCountUp'
import {
  useCharges, useClasses, useCreateCharges, useFeeItems, usePayments, useStudents, useTerms,
} from '@/data/queries'
import {
  currentTerm, defaultAmountFor, FEE_STATUS_META, feeBalancesForTerm, fullName, itemAppliesTo,
} from '@/data/selectors'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, Fab } from '@/components/ui/Button'
import {
  Avatar, CardSkeleton, EmptyState, Pill, SectionTitle,
} from '@/components/ui/primitives'
import { Segmented } from '@/components/ui/Segmented'
import { SearchInput, Field, Select, TextInput } from '@/components/ui/fields'
import { Sheet } from '@/components/ui/Sheet'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { useToast } from '@/components/ui/Toast'
import { RecordPaymentSheet } from './RecordPaymentSheet'
import { useAuth } from '@/auth/AuthProvider'
import { paymentMethodLabel } from '@/brand/categories'
import type { FeeStatus } from '@/data/types'

const COLLECTED = '#17845A'
const OUTSTANDING = '#B0730A'

const STATUS_FILTERS: Array<{ value: 'all' | FeeStatus; label: string }> = [
  { value: 'all', label: 'Everyone' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'partial', label: 'Part paid' },
  { value: 'paid', label: 'Paid up' },
]

export default function FeesPage() {
  const { can } = useAuth()
  const students = useStudents()
  const terms = useTerms()
  const charges = useCharges()
  const feeItems = useFeeItems()
  const payments = usePayments()
  const classes = useClasses()

  const [termId, setTermId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | FeeStatus>('all')
  const [search, setSearch] = useState('')
  const [recording, setRecording] = useState(false)
  const [settingFees, setSettingFees] = useState(false)

  const allTerms = terms.data ?? []
  const term = termId ? allTerms.find((t) => t.id === termId) ?? null : currentTerm(allTerms)
  const roster = (students.data ?? []).filter((s) => s.status === 'active')

  const balances = useMemo(
    () => feeBalancesForTerm(roster, term?.id ?? null, charges.data ?? [], payments.data ?? [], feeItems.data ?? [], terms.data ?? []),
    [roster, term, charges.data, payments.data, feeItems.data, terms.data],
  )

  const totals = useMemo(() => {
    const rows = [...balances.values()]
    const due = sumCents(rows.map((b) => b.dueCents))
    const collected = sumCents(rows.map((b) => b.paidCents))
    const outstanding = sumCents(rows.map((b) => Math.max(b.balanceCents, 0)))
    return {
      due,
      collected,
      outstanding,
      pctCollected: due === 0 ? 0 : collected / due,
      counts: {
        paid: rows.filter((b) => b.status === 'paid').length,
        partial: rows.filter((b) => b.status === 'partial').length,
        unpaid: rows.filter((b) => b.status === 'unpaid').length,
        overdue: rows.filter((b) => b.status === 'overdue').length,
        waived: rows.filter((b) => b.status === 'waived').length,
        none: rows.filter((b) => b.status === 'no-invoice').length,
      },
    }
  }, [balances])

  const byClass = useMemo(() => {
    const groups = new Map<string, { name: string; collected: number; outstanding: number }>()
    for (const student of roster) {
      const b = balances.get(student.id)
      if (!b) continue
      const key = student.classId ?? 'none'
      const entry = groups.get(key) ?? {
        name: student.className ?? 'No class',
        collected: 0,
        outstanding: 0,
      }
      entry.collected += b.paidCents
      entry.outstanding += Math.max(b.balanceCents, 0)
      groups.set(key, entry)
    }
    const order = (classes.data ?? []).map((c) => c.id)
    return [...groups.entries()]
      .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
      .map(([, v]) => v)
  }, [roster, balances, classes.data])

  const animatedCollected = useCountUp(totals.collected)
  const animatedOutstanding = useCountUp(totals.outstanding)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return roster
      .map((s) => ({ student: s, balance: balances.get(s.id) }))
      .filter(({ balance }) => (statusFilter === 'all' ? true : balance?.status === statusFilter))
      .filter(({ student }) => (q ? fullName(student).toLowerCase().includes(q) : true))
      .sort((a, b) => {
        const rank: Record<FeeStatus, number> = {
          overdue: 0, partial: 1, unpaid: 2, 'no-invoice': 3, waived: 4, paid: 5,
        }
        const ra = a.balance ? rank[a.balance.status] : 5
        const rb = b.balance ? rank[b.balance.status] : 5
        return ra - rb || (b.balance?.balanceCents ?? 0) - (a.balance?.balanceCents ?? 0)
      })
  }, [roster, balances, statusFilter, search])

  const recent = useMemo(() => (payments.data ?? []).slice(0, 6), [payments.data])

  function exportCsv() {
    downloadCsv(`iris-fields-fees-${term?.name.replace(/\s+/g, '-').toLowerCase() ?? 'term'}`, rows, [
      { header: 'Student', value: (r) => fullName(r.student) },
      { header: 'Class', value: (r) => r.student.className ?? '' },
      { header: 'Fee due (KES)', value: (r) => ((r.balance?.dueCents ?? 0) / 100).toFixed(2) },
      { header: 'Paid (KES)', value: (r) => ((r.balance?.paidCents ?? 0) / 100).toFixed(2) },
      { header: 'Balance (KES)', value: (r) => ((r.balance?.balanceCents ?? 0) / 100).toFixed(2) },
      { header: 'Due date', value: (r) => r.balance?.dueDate ?? '' },
      { header: 'Status', value: (r) => (r.balance ? FEE_STATUS_META[r.balance.status].label : '') },
    ])
  }

  if (students.isLoading || terms.isLoading) {
    return <div className="space-y-4"><CardSkeleton rows={2} /><CardSkeleton rows={5} /></div>
  }

  if (!term) {
    return (
      <div className="space-y-5">
        <PageHeader title="School Fees" emoji="🏫" />
        <EmptyState
          emoji="📅"
          title="No term set up yet"
          body="Fees are tracked per term. Create your first term in Settings and you can start recording what each family owes and pays."
          action={<Button onClick={() => { window.location.href = '/settings' }}>Go to Settings</Button>}
        />
      </div>
    )
  }

  if (roster.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="School Fees" emoji="🏫" />
        <EmptyState
          emoji="🎒"
          title="No children enrolled yet"
          body="Add children first — their fee records live on their profiles."
          action={<Button onClick={() => { window.location.href = '/students' }}>Go to Students</Button>}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="School Fees"
        emoji="🏫"
        subtitle={`${term.name} · ${formatDate(term.startDate, 'short')} – ${formatDate(term.endDate, 'short')}`}
        action={
          can('fees.recordPayment') ? (
            <Button className="hidden lg:inline-flex" icon={<Plus className="h-5 w-5" />} onClick={() => setRecording(true)}>
              Record payment
            </Button>
          ) : undefined
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

      {/* ------------------------------------------------------------ hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-3 sm:grid-cols-2"
      >
        <div className="relative overflow-hidden rounded-blob bg-gradient-to-br from-good-base to-[#1BAF7A] px-6 py-7 text-white shadow-lift">
          <span aria-hidden="true" className="absolute -right-8 -top-8 h-32 w-32 rounded-blob bg-white/10" />
          <p className="relative text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-white/75">
            Collected this term
          </p>
          <p className="tnum relative mt-2 font-display text-[clamp(2rem,9vw,2.9rem)] font-extrabold leading-none">
            {formatKes(Math.round(animatedCollected))}
          </p>
          <p className="relative mt-2 text-sm font-bold text-white/85">
            {Math.round(totals.pctCollected * 100)}% of {formatKes(totals.due)} expected
          </p>
        </div>

        <div className="relative overflow-hidden rounded-blob bg-white px-6 py-7 shadow-soft ring-1 ring-sand-200">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-sand-400">
            Still outstanding
          </p>
          <p
            className={cn(
              'tnum mt-2 font-display text-[clamp(2rem,9vw,2.9rem)] font-extrabold leading-none',
              totals.outstanding > 0 ? 'text-sand-900' : 'text-good-ink',
            )}
          >
            {formatKes(Math.round(animatedOutstanding))}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {totals.counts.overdue > 0 && <Pill tone="bad">{totals.counts.overdue} overdue</Pill>}
            {totals.counts.partial > 0 && <Pill tone="warn">{totals.counts.partial} part paid</Pill>}
            {totals.counts.unpaid > 0 && <Pill tone="warn">{totals.counts.unpaid} not paid yet</Pill>}
            {totals.counts.paid > 0 && <Pill tone="good">{totals.counts.paid} paid up</Pill>}
            {totals.counts.none > 0 && <Pill tone="muted">{totals.counts.none} no fees set</Pill>}
          </div>
        </div>
      </motion.section>

      {totals.due === 0 && can('fees.setInvoice') && (
        <section className="card border-2 border-dashed border-iris-200 bg-iris-50/40 text-center">
          <p className="font-display text-lg font-extrabold text-sand-900">
            No fees billed for {term.name} yet
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-sand-500">
            Bill a whole class at once — tuition is the same figure for everyone in a class — then
            adjust any child who agreed something different.
          </p>
          <Button className="mt-4" icon={<Settings2 className="h-5 w-5" />} onClick={() => setSettingFees(true)}>
            Set this term's fees
          </Button>
        </section>
      )}

      {/* -------------------------------------------------------- by class */}
      {byClass.length > 0 && totals.due > 0 && (
        <section className="card">
          <SectionTitle
            hint="Collected vs outstanding"
            action={
              can('fees.setInvoice') ? (
                <Button size="sm" variant="soft" icon={<Settings2 className="h-4 w-4" />} onClick={() => setSettingFees(true)}>
                  Set fees
                </Button>
              ) : undefined
            }
          >
            By class
          </SectionTitle>

          <div className="mb-4 flex flex-wrap gap-4 text-xs font-extrabold">
            <span className="flex items-center gap-1.5 text-sand-600">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLLECTED }} />
              Collected
            </span>
            <span className="flex items-center gap-1.5 text-sand-600">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: OUTSTANDING }} />
              Outstanding
            </span>
          </div>

          <ul className="space-y-4">
            {byClass.map((group, i) => {
              const total = group.collected + group.outstanding
              const pct = total === 0 ? 0 : group.collected / total
              return (
                <li key={group.name}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-extrabold text-sand-800">{group.name}</span>
                    <span className="tnum shrink-0 text-sm font-bold text-sand-500">
                      <span className="text-good-ink">{formatKes(group.collected, { prefix: false })}</span>
                      {' / '}
                      {formatKes(total, { prefix: false })}
                    </span>
                  </div>
                  {/* 2px surface gap between the two fills keeps them legible. */}
                  <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full bg-sand-100">
                    <motion.div
                      className="rounded-full"
                      style={{ backgroundColor: COLLECTED }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct * 100}%` }}
                      transition={{ delay: 0.08 * i, duration: 0.65, ease: 'easeOut' }}
                    />
                    <motion.div
                      className="rounded-full"
                      style={{ backgroundColor: OUTSTANDING }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(1 - pct) * 100}%` }}
                      transition={{ delay: 0.08 * i + 0.1, duration: 0.65, ease: 'easeOut' }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* --------------------------------------------------------- roster */}
      <section>
        <SectionTitle
          hint={`${rows.length} of ${roster.length} children`}
          action={
            <Button size="sm" variant="soft" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>
              Export
            </Button>
          }
        >
          Every family
        </SectionTitle>

        <div className="mb-3 space-y-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search a child…" />
          <Segmented
            ariaLabel="Fee status"
            size="sm"
            options={STATUS_FILTERS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>

        {rows.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="font-display text-lg font-extrabold text-sand-800">
              {statusFilter === 'overdue' ? 'Nobody is overdue 🎉' : 'Nothing matches'}
            </p>
            <p className="mt-1 text-sm text-sand-500">Try a different filter.</p>
          </div>
        ) : (
          <ul className="card divide-y divide-sand-100 overflow-hidden p-0">
            {rows.map(({ student, balance }) => {
              const meta = balance ? FEE_STATUS_META[balance.status] : null
              const pct =
                balance && balance.dueCents > 0
                  ? Math.min(balance.paidCents / balance.dueCents, 1)
                  : 0
              return (
                <li key={student.id}>
                  <Link
                    to={`/students/${student.id}`}
                    className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-sand-50"
                  >
                    <Avatar name={fullName(student)} src={student.photoUrl} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-extrabold text-sand-900">{fullName(student)}</p>
                      <p className="truncate text-sm text-sand-500">{student.className ?? 'No class'}</p>
                      {balance && balance.dueCents > 0 && (
                        <div className="mt-1.5 h-1.5 w-full max-w-[9rem] overflow-hidden rounded-full bg-sand-100">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: pct >= 1 ? COLLECTED : OUTSTANDING }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(pct * 100, 2)}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {balance && balance.balanceCents > 0 ? (
                        <p className="tnum font-display text-base font-extrabold text-sand-900">
                          {formatKes(balance.balanceCents, { prefix: false })}
                        </p>
                      ) : null}
                      {meta && (
                        <Pill tone={meta.tone === 'muted' ? 'muted' : meta.tone} className="mt-1">
                          <span aria-hidden="true">{meta.icon}</span> {meta.label}
                        </Pill>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* -------------------------------------------------- recent receipts */}
      {recent.length > 0 && (
        <section>
          <SectionTitle hint="Most recent first">Latest payments</SectionTitle>
          <ul className="card divide-y divide-sand-100 overflow-hidden p-0">
            {recent.map((p) => {
              const student = roster.find((s) => s.id === p.studentId)
              return (
                <li key={p.id} className="flex items-center gap-3.5 px-4 py-3.5">
                  <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-good-soft">
                    <Receipt className="h-5 w-5 text-good-ink" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold text-sand-800">
                      {student ? fullName(student) : 'A family'}
                    </p>
                    <p className="truncate text-sm text-sand-500">
                      {formatDate(p.paidOn, 'medium')} · {paymentMethodLabel(p.method)}
                      {p.reference && ` · ${p.reference}`}
                    </p>
                  </div>
                  <p className="tnum shrink-0 font-display text-base font-extrabold text-good-ink">
                    +{formatKes(p.amountCents, { prefix: false })}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {can('fees.recordPayment') && (
        <Fab label="Record payment" icon={<Plus className="h-5 w-5" />} onClick={() => setRecording(true)} className="lg:hidden" />
      )}

      {recording && <RecordPaymentSheet open={recording} onClose={() => setRecording(false)} />}
      {settingFees && (
        <SetFeesSheet open={settingFees} onClose={() => setSettingFees(false)} termId={term.id} />
      )}
    </div>
  )
}

/* ---------------------------------------------------------- set term fees */

/**
 * Billing a whole class in one go.
 *
 * Tuition is the same figure for every child in a class, so typing it twelve
 * times would be the app's fault, not the user's. Pick an item, pick a class,
 * confirm the amount, done — individual children can still be adjusted on their
 * own profile afterwards.
 */
function SetFeesSheet({
  open, onClose, termId,
}: { open: boolean; onClose: () => void; termId: string }) {
  const { notify } = useToast()
  const { data: students = [] } = useStudents()
  const { data: classes = [] } = useClasses()
  const { data: feeItems = [] } = useFeeItems()
  const { data: charges = [] } = useCharges()
  const createCharges = useCreateCharges()

  const billable = feeItems.filter((i) => !i.isArchived && !i.isNegotiated)
  const [itemKey, setItemKey] = useState(billable[0]?.key ?? '')
  const [classId, setClassId] = useState<string>('all')
  const [amountCents, setAmountCents] = useState(0)
  const [dueDate, setDueDate] = useState(todayIso())
  const [touchedAmount, setTouchedAmount] = useState(false)

  const item = feeItems.find((i) => i.key === itemKey) ?? null
  const isTermly = item ? item.cycle === 'term' || item.cycle === 'daily' : true
  const chargeTermId = isTermly ? termId : null

  const affected = useMemo(
    () => students.filter((s) =>
      s.status === 'active' &&
      (classId === 'all' || s.classId === classId) &&
      (item ? itemAppliesTo(item, s.classId) : true)),
    [students, classId, item],
  )

  // Follow the price list until somebody types their own figure.
  useEffect(() => {
    if (touchedAmount || !item) return
    const sample = affected[0]
    setAmountCents(defaultAmountFor(item, sample?.classId ?? null))
  }, [item, affected, touchedAmount])

  const alreadyBilled = affected.filter((s) =>
    charges.some((c) => c.studentId === s.id && c.itemKey === itemKey && c.termId === chargeTermId),
  )
  const toBill = affected.filter((s) => !alreadyBilled.some((a) => a.id === s.id))

  async function apply() {
    if (!item || amountCents <= 0 || toBill.length === 0) return
    try {
      await createCharges.mutateAsync(
        toBill.map((s) => ({
          studentId: s.id,
          itemKey: item.key,
          termId: chargeTermId,
          // Per-class pricing wins when billing everyone at once.
          amountCents: classId === 'all' && !touchedAmount
            ? defaultAmountFor(item, s.classId) || amountCents
            : amountCents,
          fullAmountCents: null,
          proratedFrom: null,
          dueDate,
          quantity: null,
          notes: null,
          isWaived: false,
        })),
      )
      notify(`${item.label} billed to ${toBill.length} ${toBill.length === 1 ? 'child' : 'children'}.`)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not set those fees.', 'error')
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Bill a whole class"
      description="Adds one fee line to every child in the class. You can adjust an individual child afterwards."
      footer={
        <Button
          block
          size="lg"
          disabled={!item || toBill.length === 0 || amountCents <= 0}
          loading={createCharges.isPending}
          onClick={() => void apply()}
        >
          Bill {toBill.length} {toBill.length === 1 ? 'child' : 'children'}
        </Button>
      }
    >
      <div className="space-y-5 pb-4">
        <Field label="What are you billing?">
          <Select
            value={itemKey}
            onChange={(e) => {
              setItemKey(e.target.value)
              setTouchedAmount(false)
            }}
          >
            {billable.map((i) => (
              <option key={i.key} value={i.key}>{i.emoji} {i.label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Which class?">
          <Select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value)
              setTouchedAmount(false)
            }}
          >
            <option value="all">Every class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({students.filter((s) => s.classId === c.id && s.status === 'active').length})
              </option>
            ))}
          </Select>
        </Field>

        {classId === 'all' && !touchedAmount && item && Object.keys(item.classAmounts).length > 0 ? (
          <div className="rounded-2xl bg-iris-50 p-4">
            <p className="text-sm font-extrabold text-iris-700">Each class gets its own price</p>
            <ul className="mt-2 space-y-1 text-sm font-semibold text-iris-600">
              {classes
                .filter((c) => item.classAmounts[c.id] !== undefined)
                .map((c) => (
                  <li key={c.id} className="tnum flex justify-between">
                    <span>{c.name}</span>
                    <span>{formatKes(item.classAmounts[c.id])}</span>
                  </li>
                ))}
            </ul>
            <button
              onClick={() => setTouchedAmount(true)}
              className="mt-3 text-sm font-extrabold text-iris-700 underline"
            >
              Use one amount for everyone instead
            </button>
          </div>
        ) : (
          <Field label="Amount each" required>
            <MoneyInput
              valueCents={amountCents}
              onChange={(next) => {
                setTouchedAmount(true)
                setAmountCents(next)
              }}
              autoFocus={false}
            />
          </Field>
        )}

        <Field label="Due by">
          <TextInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value || todayIso())} />
        </Field>

        {alreadyBilled.length > 0 && (
          <p className="rounded-2xl bg-warn-soft px-4 py-3 text-sm font-bold text-warn-ink">
            {alreadyBilled.length} {alreadyBilled.length === 1 ? 'child already has' : 'children already have'}{' '}
            this line for {isTermly ? 'this term' : 'the year'} — they will be skipped, so nobody is
            billed twice.
          </p>
        )}
      </div>
    </Sheet>
  )
}
