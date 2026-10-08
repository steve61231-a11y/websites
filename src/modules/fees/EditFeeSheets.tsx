import { useState } from 'react'
import { formatKes } from '@/lib/money'
import { todayIso } from '@/lib/dates'
import { PAYMENT_METHODS } from '@/brand/categories'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { ChoiceChips, DateField, Field, Select, TextArea, TextInput, Toggle } from '@/components/ui/fields'
import { useToast } from '@/components/ui/Toast'
import { useUpdateCharge, useUpdatePayment } from '@/data/queries'
import type { ChargeBalance, FeeCharge, FeeItem, FeePayment, PaymentMethod } from '@/data/types'

/**
 * Correcting a line on a bill.
 *
 * Fees get agreed, re-agreed and occasionally written off entirely, so an
 * amount typed in September has to be changeable in October without deleting
 * the line and losing the payments attached to it.
 */
export function EditChargeSheet({
  charge, item, open, onClose,
}: { charge: FeeCharge; item: FeeItem | null; open: boolean; onClose: () => void }) {
  const { notify } = useToast()
  const updateCharge = useUpdateCharge()

  const [amountCents, setAmountCents] = useState(charge.amountCents)
  const [dueDate, setDueDate] = useState(charge.dueDate ?? todayIso())
  const [quantity, setQuantity] = useState(charge.quantity ?? 0)
  const [isWaived, setIsWaived] = useState(charge.isWaived)
  const [notes, setNotes] = useState(charge.notes ?? '')

  const isDaily = item?.cycle === 'daily'
  const rate = item?.defaultAmountCents ?? 0

  async function save() {
    try {
      await updateCharge.mutateAsync({
        id: charge.id,
        patch: {
          amountCents,
          dueDate,
          quantity: isDaily ? quantity : null,
          isWaived,
          notes: notes.trim() || null,
        },
      })
      notify(`${item?.label ?? 'Fee line'} updated.`)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save that change.', 'error')
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Edit ${item?.label ?? 'this fee'}`}
      description="Change what was agreed, or write it off entirely."
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" block onClick={onClose}>Cancel</Button>
          <Button block loading={updateCharge.isPending} onClick={() => void save()}>
            Save {formatKes(isWaived ? 0 : amountCents)}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pb-4">
        {isDaily && (
          <Field label="Days attended" hint={`${formatKes(rate)} a day`}>
            <TextInput
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => {
                const days = Number(e.target.value)
                setQuantity(days)
                setAmountCents(days * rate)
              }}
            />
          </Field>
        )}

        <Field label="Amount owed" required>
          <MoneyInput valueCents={amountCents} onChange={setAmountCents} autoFocus={false} />
        </Field>

        <Field label="Due by">
          <TextInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value || todayIso())} />
        </Field>

        <Toggle
          checked={isWaived}
          onChange={setIsWaived}
          label="Write this off"
          description="It stops counting as owed. Any payments already recorded against it are kept."
        />

        <Field label="Note" hint="Optional — why it changed">
          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Agreed a lower transport rate — lives nearby."
          />
        </Field>

        {charge.proratedFrom && charge.fullAmountCents !== null && (
          <p className="rounded-2xl bg-sand-50 px-4 py-3 text-sm text-sand-500">
            This line was prorated from {formatKes(charge.fullAmountCents)} because the child
            joined part-way through the term. Changing the amount here replaces that figure.
          </p>
        )}
      </div>
    </Sheet>
  )
}

/**
 * Correcting a payment. The amount, the day, the method and the reference can
 * all be wrong — usually the reference, typed from a screenshot of an M-Pesa
 * message — and a wrong payment quietly makes a family's balance wrong too.
 */
export function EditPaymentSheet({
  payment, lines, open, onClose,
}: {
  payment: FeePayment
  lines: readonly ChargeBalance[]
  open: boolean
  onClose: () => void
}) {
  const { notify } = useToast()
  const updatePayment = useUpdatePayment()

  const [amountCents, setAmountCents] = useState(payment.amountCents)
  const [paidOn, setPaidOn] = useState(payment.paidOn)
  const [method, setMethod] = useState<PaymentMethod>(payment.method)
  const [reference, setReference] = useState(payment.reference ?? '')
  const [chargeId, setChargeId] = useState(payment.chargeId ?? '')

  async function save() {
    try {
      await updatePayment.mutateAsync({
        id: payment.id,
        patch: {
          amountCents,
          paidOn,
          method,
          reference: reference.trim() || null,
          chargeId: chargeId || null,
        },
      })
      notify('Payment updated.')
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save that change.', 'error')
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Edit this payment"
      description={`Recorded by ${payment.createdByName ?? 'the school'}`}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" block onClick={onClose}>Cancel</Button>
          <Button
            block
            disabled={amountCents <= 0}
            loading={updatePayment.isPending}
            onClick={() => void save()}
          >
            Save {formatKes(amountCents)}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pb-4">
        <Field label="How much?" required>
          <MoneyInput valueCents={amountCents} onChange={setAmountCents} autoFocus={false} />
        </Field>

        <Field label="What was it for?">
          <Select value={chargeId} onChange={(e) => setChargeId(e.target.value)}>
            <option value="">Not against anything in particular</option>
            {lines.map((line) => (
              <option key={line.charge.id} value={line.charge.id}>
                {line.item?.label ?? line.charge.itemKey} — {formatKes(line.charge.amountCents)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="How did they pay?">
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

        <Field label="Reference" hint="Optional">
          <TextInput
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            placeholder="QGH4X2LM01"
          />
        </Field>
      </div>
    </Sheet>
  )
}
