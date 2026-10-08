import { useState } from 'react'

import { formatKes } from '@/lib/money'
import { todayIso } from '@/lib/dates'
import { CATEGORY_LIST, PAYMENT_METHODS } from '@/brand/categories'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { ChoiceChips, DateField, Field, TextArea, TextInput } from '@/components/ui/fields'
import { useToast } from '@/components/ui/Toast'
import { useUpdateExpense, useVendors } from '@/data/queries'
import type { Expense, ExpenseCategoryKey, PaymentMethod } from '@/data/types'

/**
 * Correcting an expense after it was saved.
 *
 * People mistype amounts and pick the wrong category, and they usually notice
 * days later while looking at a total that seems off. Deleting and re-entering
 * loses who logged it and when, so everything here is editable in place.
 */
export function EditExpenseSheet({
  expense, open, onClose,
}: { expense: Expense; open: boolean; onClose: () => void }) {
  const { notify } = useToast()
  const updateExpense = useUpdateExpense()
  const { data: vendors = [] } = useVendors()

  const [categoryKey, setCategoryKey] = useState<ExpenseCategoryKey>(expense.categoryKey)
  const [amountCents, setAmountCents] = useState(expense.amountCents)
  const [vendorName, setVendorName] = useState(expense.vendorName)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(expense.paymentMethod)
  const [date, setDate] = useState(expense.date)
  const [notes, setNotes] = useState(expense.notes ?? '')

  const suggestions = vendors
    .filter((v) => v.categoryKey === categoryKey && !v.isArchived)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 6)

  async function save() {
    if (amountCents <= 0 || !vendorName.trim()) return
    try {
      await updateExpense.mutateAsync({
        id: expense.id,
        patch: {
          categoryKey,
          amountCents,
          vendorName: vendorName.trim(),
          // The old vendor link no longer holds once the category changes.
          vendorId: categoryKey === expense.categoryKey ? expense.vendorId : null,
          paymentMethod,
          date,
          notes: notes.trim() || null,
        },
      })
      notify('Expense updated.')
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save that change.', 'error')
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Edit this expense"
      description={`Logged by ${expense.createdByName ?? 'the school'}`}
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" block onClick={onClose}>Cancel</Button>
          <Button
            block
            disabled={amountCents <= 0 || !vendorName.trim()}
            loading={updateExpense.isPending}
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

        <Field label="What was it for?" required>
          <ChoiceChips
            ariaLabel="Category"
            columns={2}
            size="sm"
            options={CATEGORY_LIST.map((c) => ({
              value: c.key, label: c.short, emoji: c.emoji, color: c.color,
            }))}
            value={categoryKey}
            onChange={(next) => setCategoryKey(next as ExpenseCategoryKey)}
          />
        </Field>

        <Field label="Paid to" required>
          <TextInput
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            placeholder="Who received the money"
          />
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVendorName(v.name)}
                  className="min-h-[38px] rounded-xl border-2 border-sand-200 bg-white px-3 text-sm font-extrabold text-sand-600 transition-colors hover:border-iris-300"
                >
                  {v.name}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field label="How was it paid?" required>
          <ChoiceChips
            ariaLabel="Payment method"
            columns={3}
            options={PAYMENT_METHODS.map((m) => ({ value: m.key, label: m.label, emoji: m.emoji }))}
            value={paymentMethod}
            onChange={(next) => setPaymentMethod(next as PaymentMethod)}
          />
        </Field>

        <Field label="When?">
          <DateField value={date} onChange={setDate} max={todayIso()} />
        </Field>

        <Field label="Note" hint="Optional">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
    </Sheet>
  )
}


