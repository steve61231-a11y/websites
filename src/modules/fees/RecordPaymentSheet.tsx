import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatKes } from '@/lib/money'
import { todayIso } from '@/lib/dates'
import {
  useCreatePayment, useInvoices, usePayments, useStudents, useTerms,
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
 * Recording a fee payment. Same shape as logging an expense — pick who, tap the
 * amount, confirm — because the person doing both is the same person, and the
 * two jobs should not feel like two different apps.
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
  const { data: invoices = [] } = useInvoices()
  const { data: payments = [] } = usePayments()
  const createPayment = useCreatePayment()

  const term = currentTerm(terms)
  const [studentId, setStudentId] = useState(presetStudentId ?? '')
  const [search, setSearch] = useState('')
  const [amountCents, setAmountCents] = useState(0)
  const [method, setMethod] = useState<PaymentMethod>('mpesa')
  const [paidOn, setPaidOn] = useState(todayIso())
  const [reference, setReference] = useState('')
  const [saved, setSaved] = useState<number | null>(null)

  const student = students.find((s) => s.id === studentId)

  const balance = useMemo(
    () => (student && term ? feeBalance(student.id, term.id, invoices, payments) : null),
    [student, term, invoices, payments],
  )

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students
      .filter((s) => s.status === 'active')
      .filter((s) => (q ? fullName(s).toLowerCase().includes(q) : true))
      .slice(0, 8)
  }, [students, search])

  async function submit() {
    if (!student || !term || amountCents <= 0) return
    try {
      await createPayment.mutateAsync({
        studentId: student.id,
        termId: term.id,
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
            disabled={!student || !term || amountCents <= 0}
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

          {balance && balance.balanceCents > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setAmountCents(balance.balanceCents)}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-colors',
                amountCents === balance.balanceCents
                  ? 'bg-good-soft text-good-ink'
                  : 'bg-gold-50 text-gold-800 hover:bg-gold-100',
              )}
            >
              <span className="text-sm font-extrabold">
                {amountCents === balance.balanceCents ? 'Clearing the full balance' : 'Pay the full balance'}
              </span>
              <span className="tnum font-display text-base font-extrabold">
                {formatKes(balance.balanceCents)}
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
          sub={`${formatKes(saved)}${student ? ` from ${fullName(student)}'s family` : ''}`}
          onDone={reset}
        />
      )}
    </>
  )
}
