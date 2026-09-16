import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Trash2, User2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatKes } from '@/lib/money'
import { formatDate, formatRelativeDay } from '@/lib/dates'
import { categoryToken, paymentMethodLabel } from '@/brand/categories'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Sheet'
import { useDeleteExpense } from '@/data/queries'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/auth/AuthProvider'
import type { Expense } from '@/data/types'

/**
 * The audit trail. Deliberately the last thing on the page — it is the escape
 * hatch for checking a specific entry, not the thing you scan every morning.
 * Rows expand rather than navigate, so you never lose your place in the list.
 */
export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null)
  const deleteExpense = useDeleteExpense()
  const { notify } = useToast()
  const { can, profile } = useAuth()

  let lastDate: string | null = null

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteExpense.mutateAsync(pendingDelete.id)
      notify('Expense deleted.', 'info')
      setPendingDelete(null)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete that.', 'error')
    }
  }

  return (
    <>
      <ul className="card divide-y divide-sand-100 overflow-hidden p-0">
        {expenses.map((expense) => {
          const token = categoryToken(expense.categoryKey)
          const open = openId === expense.id
          const showDateHeader = expense.date !== lastDate
          lastDate = expense.date
          const mayDelete =
            can('expenses.delete') ||
            (can('expenses.edit') && expense.createdBy === profile?.id)

          return (
            <li key={expense.id}>
              {showDateHeader && (
                <p className="bg-sand-50/80 px-4 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-sand-400">
                  {formatRelativeDay(expense.date)} · {formatDate(expense.date, 'medium')}
                </p>
              )}

              <button
                onClick={() => setOpenId(open ? null : expense.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-sand-50"
              >
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg"
                  style={{ backgroundColor: token.soft }}
                >
                  {token.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-extrabold text-sand-800">
                    {expense.vendorName || token.label}
                  </span>
                  <span className="flex items-center gap-1.5 truncate text-sm text-sand-500">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: token.color }}
                    />
                    {expense.categoryKey === 'other' && expense.customCategory
                      ? expense.customCategory
                      : token.short}
                    <span aria-hidden="true">·</span>
                    {paymentMethodLabel(expense.paymentMethod)}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="tnum block font-display text-base font-extrabold text-sand-900">
                    {formatKes(expense.amountCents, { prefix: false })}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-sand-300 transition-transform duration-200',
                    open && 'rotate-180',
                  )}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="overflow-hidden bg-sand-50/70"
                  >
                    <div className="space-y-3 px-4 py-4">
                      {expense.notes && (
                        <p className="rounded-2xl bg-white p-3.5 text-[0.95rem] leading-relaxed text-sand-700 shadow-soft">
                          {expense.notes}
                        </p>
                      )}
                      <dl className="grid grid-cols-2 gap-3 text-sm">
                        <Detail label="Amount" value={formatKes(expense.amountCents)} />
                        <Detail label="Paid by" value={paymentMethodLabel(expense.paymentMethod)} />
                        <Detail label="Date" value={formatDate(expense.date, 'long')} />
                        <Detail label="Category" value={token.label} />
                      </dl>
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <p className="flex items-center gap-1.5 text-xs font-bold text-sand-400">
                          <User2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Logged by {expense.createdByName ?? 'the school'}
                        </p>
                        {mayDelete && (
                          <Button
                            size="sm"
                            variant="danger"
                            icon={<Trash2 className="h-4 w-4" />}
                            onClick={() => setPendingDelete(expense)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        busy={deleteExpense.isPending}
        title="Delete this expense?"
        body={
          pendingDelete
            ? `${formatKes(pendingDelete.amountCents)} to ${pendingDelete.vendorName} on ${formatDate(
                pendingDelete.date,
                'long',
              )} will be removed. This cannot be undone.`
            : ''
        }
      />
    </>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3.5 py-2.5 shadow-soft">
      <dt className="text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-sand-400">{label}</dt>
      <dd className="tnum mt-0.5 font-bold text-sand-800">{value}</dd>
    </div>
  )
}
