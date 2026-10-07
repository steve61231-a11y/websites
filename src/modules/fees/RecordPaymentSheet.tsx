import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatKes } from '@/lib/money'
import { todayIso } from '@/lib/dates'
import {
  useCharges, useCreatePayment, useFeeItems, usePayments, useStudents, useTerms,
} from '@/data/queries'
import { currentTerm, feeBalance, fullName } from '@/data/selectors'
import { PAYMENT_METHODS } from '@/brand/categories'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { ChoiceChips, DateField, Field, SearchInput, TextInput } from '@/components/ui/fields'
import { Avatar } from '@/components/ui/primitives'
import { SuccessBurst } from '@/components/ui/SuccessBurst'
import { useToast } from '@/components/ui/Toast'
import type { PaymentMethod } from '@/data/types'

/**
 * Recording a fee payment.
 *
 * The extra step over a plain amount is choosing *what the money is for* —
 * tuition, transport, stationery. Without that the school can see a family has
 * paid something but not whether the bus is settled, which is the question they
 * actually ask. The line is pre-picked as the biggest thing still owing, so in
 * the common case it is still pick-child, tap-amount, save.
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
  const createPayment = useCreatePayment()

  const term = currentTerm(terms)
  const [studentId, setStudentId] = useState(presetStudentId ?? '')
  const [search, setSearch] = useState('')
  const [chargeId, setChargeId] = useState<string | null>(null)
  const [amountCents, setAmountCents] = useState(0)
  const [method, setMethod] = useState<PaymentMethod>('mpesa')
  const [paidOn, setPaidOn] = useState(todayIso())
  const [reference, setReference] = useState('')
  const [saved, setSaved] = useState<number | null>(null)

  const student = students.find((s) => s.id === studentId)

  const balance = useMemo(
    () => (student ? feeBalance(student.id, term?.id ?? null, charges, payments, feeItems, terms) : null),
    [student, term, charges, payments, feeItems, terms],
  )

  const outstanding = useMemo(
    () => (balance?.lines ?? []).filter((l) => l.balanceCents > 0 && !l.charge.isWaived),
    [balance],
  )

  // Default to the biggest thing still owing — nearly always tuition.
  useEffect(() => {
    if (!student) {
      setChargeId(null)
      return
    }
    const biggest = [...outstanding].sort((a, b) => b.balanceCents - a.balanceCents)[0]
    setChargeId(biggest?.charge.id ?? null)
  }, [student, outstanding.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const selected = outstanding.find((l) => l.charge.id === chargeId) ?? null

  async function submit() {
    if (!student || amountCents <= 0) return
    try {
      await createPayment.mutateAsync({
        studentId: student.id,
        termId: selected?.charge.termId ?? term?.id ?? null,
        chargeId,
        amountCents,
        paidOn,
        method,
        reference: reference.trim() || null,
        notes: null,
      })
      setSaved(amountCents)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'That payment did not save.', 'error')
    }
  }

  function reset() {
    setSaved(null)
    setAmountCents(0)
    setReference('')
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
        title="Record a fee payment"
        description={term ? `Towards ${term.name}` : 'Set up a term in Settings first'}
        footer={
          <Button
            block
            size="lg"
            icon={<Check className="h-5 w-5" />}
            disabled={!student || amountCents <= 0}
            loading={createPayment.isPending}
            onClick={() => void submit()}
          >
            {amountCents > 0 ? `Save ${formatKes(amountCents)}` : 'Save payment'}
          </Button>
        }
      >
        <div className="space-y-6 pb-4">
          {!presetStudentId && (
            <Field label="Which child?" required>
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
                      {balance && balance.balanceCents > 0 &&
                        ` · ${formatKes(balance.balanceCents)} outstanding`}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-extrabold text-iris-600">Change</span>
                </button>
              ) : (
                <div className="space-y-2.5">
                  <SearchInput value={search} onChange={setSearch} placeholder="Type a name…" />
                  <div className="max-h-60 space-y-1.5 overflow-y-auto">
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

          {student && (
            <Field label="What is this payment for?" required>
              {outstanding.length === 0 ? (
                <p className="rounded-2xl bg-good-soft px-4 py-4 text-center text-sm font-bold text-good-ink">
                  Nothing outstanding for {student.firstName} right now. Anything you record will be
                  held against the term without a specific line.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {outstanding.map((line) => {
                    const active = chargeId === line.charge.id
                    return (
                      <button
                        key={line.charge.id}
                        onClick={() => setChargeId(line.charge.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all',
                          active
                            ? 'border-iris-500 bg-iris-50'
                            : 'border-sand-200 bg-white hover:border-iris-300',
                        )}
                      >
                        <span aria-hidden="true" className="shrink-0 text-xl">
                          {line.item?.emoji ?? '📌'}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-extrabold text-sand-800">
                            {line.item?.label ?? line.charge.itemKey}
                          </span>
                          <span className="tnum block text-sm text-sand-500">
                            {formatKes(line.balanceCents)} still owing
                            {line.paidCents > 0 && ` · ${formatKes(line.paidCents)} paid`}
                          </span>
                        </span>
                        {active && <Check className="h-5 w-5 shrink-0 text-iris-600" aria-hidden="true" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </Field>
          )}

          {selected && selected.balanceCents > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setAmountCents(selected.balanceCents)}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-colors',
                amountCents === selected.balanceCents
                  ? 'bg-good-soft text-good-ink'
                  : 'bg-gold-50 text-gold-800 hover:bg-gold-100',
              )}
            >
              <span className="text-sm font-extrabold">
                {amountCents === selected.balanceCents
                  ? `Clearing ${selected.item?.label ?? 'this'} in full`
                  : `Pay off ${selected.item?.label ?? 'this line'}`}
              </span>
              <span className="tnum font-display text-base font-extrabold">
                {formatKes(selected.balanceCents)}
              </span>
            </motion.button>
          )}

          <Field label="How much?" required>
            <MoneyInput valueCents={amountCents} onChange={setAmountCents} autoFocus={false} />
          </Field>

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
          sub={`${formatKes(saved)}${selected?.item ? ` towards ${selected.item.label.toLowerCase()}` : ''}`}
          onDone={reset}
        />
      )}
    </>
  )
}


