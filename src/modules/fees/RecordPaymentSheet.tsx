import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatKes } from '@/lib/money'
import { todayIso } from '@/lib/dates'
import {
  useCharges, useCreatePayments, useFeeItems, usePayments, useStudents, useTerms,
} from '@/data/queries'
import { allocatePayment, currentTerm, feeBalance, fullName } from '@/data/selectors'
import { PAYMENT_METHODS } from '@/brand/categories'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { ChoiceChips, DateField, Field, SearchInput, TextInput } from '@/components/ui/fields'
import { Avatar } from '@/components/ui/primitives'
import { SuccessBurst } from '@/components/ui/SuccessBurst'
import { useToast } from '@/components/ui/Toast'
import type { FeePayment, PaymentMethod } from '@/data/types'

type PaymentRow = Omit<FeePayment, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>

/**
 * Recording a fee payment.
 *
 * A parent pays whatever they have, whenever they have it — almost never the
 * exact amount of one line. So this asks only two things: who, and how much.
 * The money is then applied to the oldest debt first and spills into the next,
 * which is what the office does on paper anyway, and the sheet simply *shows*
 * what the payment clears. Choosing a specific line is still possible, but it
 * is the exception behind a link rather than a question everyone must answer.
 */
export function RecordPaymentSheet({
  open, onClose, presetStudentId,
}: {
  open: boolean
  onClose: () => void
  presetStudentId?: string
}) {
  const { notify } = useToast()
  const { data: students = [] } = useStudents()
  const { data: terms = [] } = useTerms()
  const { data: charges = [] } = useCharges()
  const { data: payments = [] } = usePayments()
  const { data: feeItems = [] } = useFeeItems()
  const createPayments = useCreatePayments()

  const term = currentTerm(terms)
  const [studentId, setStudentId] = useState(presetStudentId ?? '')
  const [search, setSearch] = useState('')
  const [amountCents, setAmountCents] = useState(0)
  const [method, setMethod] = useState<PaymentMethod>('mpesa')
  const [paidOn, setPaidOn] = useState(todayIso())
  const [reference, setReference] = useState('')
  const [pickedChargeId, setPickedChargeId] = useState<string | null>(null)
  const [choosing, setChoosing] = useState(false)
  const [saved, setSaved] = useState<{ amount: number; what: string } | null>(null)

  const student = students.find((s) => s.id === studentId)

  const balance = useMemo(
    () => (student ? feeBalance(student.id, term?.id ?? null, charges, payments, feeItems, terms) : null),
    [student, term, charges, payments, feeItems, terms],
  )

  const outstanding = useMemo(
    () => (balance?.lines ?? []).filter((l) => l.balanceCents > 0 && !l.charge.isWaived),
    [balance],
  )

  /** What this money will settle, oldest debt first — or the one line chosen. */
  const plan = useMemo(() => {
    if (amountCents <= 0) return { allocations: [], unassignedCents: 0 }
    if (pickedChargeId) {
      const line = outstanding.find((l) => l.charge.id === pickedChargeId)
      if (line) {
        return allocatePayment(amountCents, [line])
      }
    }
    return allocatePayment(amountCents, outstanding)
  }, [amountCents, outstanding, pickedChargeId])

  // A child with a clean slate has nothing to choose between.
  useEffect(() => {
    if (outstanding.length === 0) setPickedChargeId(null)
  }, [outstanding.length])

  async function submit() {
    if (!student || amountCents <= 0) return
    const common = {
      studentId: student.id,
      paidOn,
      method,
      reference: reference.trim() || null,
      notes: null,
    }
    // Each line it settles gets its own row, so every line's balance stays
    // exact. They share a date, method and reference, which is what makes them
    // read back as the single payment the parent actually made.
    const rows: PaymentRow[] = plan.allocations.map((a) => ({
      ...common,
      chargeId: a.chargeId,
      termId: charges.find((c) => c.id === a.chargeId)?.termId ?? term?.id ?? null,
      amountCents: a.amountCents,
    }))
    // Money beyond what is owed is still their money: it is recorded against
    // the term without a line rather than being refused or quietly dropped.
    if (plan.unassignedCents > 0 || rows.length === 0) {
      rows.push({
        ...common,
        chargeId: null,
        termId: term?.id ?? null,
        amountCents: plan.unassignedCents > 0 ? plan.unassignedCents : amountCents,
      })
    }

    try {
      await createPayments.mutateAsync(rows)
      setSaved({
        amount: amountCents,
        what: plan.allocations.length > 0
          ? plan.allocations.map((a) => a.label.toLowerCase()).join(' and ')
          : 'their account',
      })
    } catch (err) {
      notify(err instanceof Error ? err.message : 'That payment did not save.', 'error')
    }
  }

  function reset() {
    setSaved(null)
    setAmountCents(0)
    setReference('')
    setPickedChargeId(null)
    setChoosing(false)
    if (!presetStudentId) setStudentId('')
    onClose()
  }

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students
      .filter((s) => s.status === 'active')
      .filter((s) => (q ? fullName(s).toLowerCase().includes(q) : true))
      .slice(0, 8)
  }, [students, search])

  return (
    <>
      <Sheet
        open={open && saved === null}
        onClose={onClose}
        title="Record a payment"
        description={student ? `For ${fullName(student)}` : 'Who paid, and how much'}
        footer={
          <Button
            block
            size="lg"
            icon={<Check className="h-5 w-5" />}
            disabled={!student || amountCents <= 0}
            loading={createPayments.isPending}
            onClick={() => void submit()}
          >
            {amountCents > 0 ? `Save ${formatKes(amountCents)}` : 'Save payment'}
          </Button>
        }
      >
        <div className="space-y-6 pb-4">
          {/* ------------------------------------------------------- who */}
          {!presetStudentId && (
            <Field label="Who paid?" required>
              {student ? (
                <button
                  onClick={() => setStudentId('')}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-iris-400 bg-iris-50 p-3 text-left"
                >
                  <Avatar name={fullName(student)} src={student.photoUrl} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-extrabold text-sand-900">{fullName(student)}</span>
                    <span className="block truncate text-sm text-sand-500">
                      {student.className ?? 'No class'}
                      {balance && balance.balanceCents > 0
                        ? ` · owes ${formatKes(balance.balanceCents)}`
                        : ' · nothing owing'}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-extrabold text-iris-600">Change</span>
                </button>
              ) : (
                <div className="space-y-2.5">
                  <SearchInput value={search} onChange={setSearch} placeholder="Type a name…" />
                  <div className="max-h-56 space-y-1.5 overflow-y-auto">
                    {candidates.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStudentId(s.id)}
                        className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors hover:bg-sand-100"
                      >
                        <Avatar name={fullName(s)} src={s.photoUrl} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-extrabold text-sand-800">{fullName(s)}</span>
                          <span className="block truncate text-sm text-sand-500">{s.className ?? 'No class'}</span>
                        </span>
                      </button>
                    ))}
                    {candidates.length === 0 && (
                      <p className="px-3 py-6 text-center text-sm font-semibold text-sand-400">
                        No child matches that name.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Field>
          )}

          {/* ---------------------------------------------------- how much */}
          <Field label="How much did they pay?" required>
            <MoneyInput valueCents={amountCents} onChange={setAmountCents} autoFocus={false} />
            {student && balance && balance.balanceCents > 0 && (
              <button
                onClick={() => setAmountCents(balance.balanceCents)}
                className={cn(
                  'mt-2.5 flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-colors',
                  amountCents === balance.balanceCents
                    ? 'bg-good-soft text-good-ink'
                    : 'bg-gold-50 text-gold-800 hover:bg-gold-100',
                )}
              >
                <span className="text-sm font-extrabold">
                  {amountCents === balance.balanceCents ? 'Clearing everything they owe' : 'They paid it all'}
                </span>
                <span className="tnum font-display text-base font-extrabold">
                  {formatKes(balance.balanceCents)}
                </span>
              </button>
            )}
          </Field>

          {/* ------------------------------------------- what it settles */}
          {student && amountCents > 0 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <p className="mb-2 text-sm font-extrabold text-sand-700">This payment clears</p>

              {plan.allocations.length === 0 ? (
                <p className="rounded-2xl bg-sand-100 px-4 py-4 text-sm font-bold text-sand-600">
                  {outstanding.length === 0
                    ? `${student.firstName} has nothing outstanding, so this is kept on their account as credit.`
                    : 'Enter an amount to see what it settles.'}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {plan.allocations.map((a) => {
                    const line = outstanding.find((l) => l.charge.id === a.chargeId)
                    const clearsIt = line ? a.amountCents >= line.balanceCents : false
                    return (
                      <li
                        key={a.chargeId}
                        className="flex items-center gap-3 rounded-2xl bg-good-soft px-3.5 py-3"
                      >
                        <span aria-hidden="true" className="shrink-0 text-lg">{line?.item?.emoji ?? '💰'}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-extrabold text-good-ink">{a.label}</span>
                          <span className="tnum block text-xs font-bold text-good-ink/75">
                            {clearsIt
                              ? 'settled in full'
                              : `${formatKes((line?.balanceCents ?? 0) - a.amountCents)} would still be owing`}
                          </span>
                        </span>
                        <span className="tnum shrink-0 font-display text-base font-extrabold text-good-ink">
                          {formatKes(a.amountCents)}
                        </span>
                      </li>
                    )
                  })}
                  {plan.unassignedCents > 0 && (
                    <li className="flex items-center gap-3 rounded-2xl bg-gold-50 px-3.5 py-3">
                      <span aria-hidden="true" className="shrink-0 text-lg">🪙</span>
                      <span className="min-w-0 flex-1 font-extrabold text-gold-800">
                        Left over, kept as credit
                      </span>
                      <span className="tnum shrink-0 font-display text-base font-extrabold text-gold-800">
                        {formatKes(plan.unassignedCents)}
                      </span>
                    </li>
                  )}
                </ul>
              )}

              {outstanding.length > 1 && (
                <button
                  onClick={() => setChoosing((v) => !v)}
                  className="mt-2.5 flex items-center gap-2 text-sm font-extrabold text-iris-600 hover:text-iris-700"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  {pickedChargeId ? 'Put it somewhere else' : 'Put it against one thing instead'}
                </button>
              )}

              <AnimatePresence>
                {choosing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2.5 space-y-1.5 overflow-hidden"
                  >
                    <button
                      onClick={() => { setPickedChargeId(null); setChoosing(false) }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors',
                        pickedChargeId === null
                          ? 'border-iris-500 bg-iris-50'
                          : 'border-sand-200 bg-white hover:border-iris-300',
                      )}
                    >
                      <ArrowRight className="h-5 w-5 shrink-0 text-iris-500" aria-hidden="true" />
                      <span className="font-extrabold text-sand-800">Oldest first (recommended)</span>
                    </button>
                    {outstanding.map((line) => (
                      <button
                        key={line.charge.id}
                        onClick={() => { setPickedChargeId(line.charge.id); setChoosing(false) }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors',
                          pickedChargeId === line.charge.id
                            ? 'border-iris-500 bg-iris-50'
                            : 'border-sand-200 bg-white hover:border-iris-300',
                        )}
                      >
                        <span aria-hidden="true" className="shrink-0 text-lg">{line.item?.emoji ?? '📌'}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-extrabold text-sand-800">
                            {line.item?.label ?? line.charge.itemKey}
                          </span>
                          <span className="tnum block text-sm text-sand-500">
                            {formatKes(line.balanceCents)} owing
                          </span>
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ----------------------------------------------------- details */}
          <Field label="How did they pay?" required>
            <ChoiceChips
              ariaLabel="Payment method"
              columns={3}
              options={PAYMENT_METHODS.map((m) => ({ value: m.key, label: m.label, emoji: m.emoji }))}
              value={method}
              onChange={(next) => setMethod(next as PaymentMethod)}
            />
          </Field>

          <Field label="When?">
            <DateField value={paidOn} onChange={setPaidOn} max={todayIso()} />
          </Field>

          <Field label="Reference" hint="Optional — e.g. the M-Pesa code">
            <TextInput
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              placeholder="QGH4X2LM01"
              autoComplete="off"
            />
          </Field>
        </div>
      </Sheet>

      {saved !== null && (
        <SuccessBurst
          message="Payment recorded"
          sub={`${formatKes(saved.amount)} towards ${saved.what}`}
          onDone={reset}
        />
      )}
    </>
  )
}


