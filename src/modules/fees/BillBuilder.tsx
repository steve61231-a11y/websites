import { useMemo, useState } from 'react'
import { Check, Info } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatKes, parseKesToCents } from '@/lib/money'
import { todayIso } from '@/lib/dates'
import { useCreateCharges, useFeeItems, useTerms } from '@/data/queries'
import { currentTerm, defaultAmountFor, itemsForStudent } from '@/data/selectors'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { Field, TextInput } from '@/components/ui/fields'
import { Toggle } from '@/components/ui/fields'
import { useToast } from '@/components/ui/Toast'
import type { FeeChargeDraft, FeeItem, Student } from '@/data/types'

type Row = {
  item: FeeItem
  include: boolean
  amountText: string
  /** Days attended, for the daycare line. */
  quantity: number
  /** Spread across the terms rather than paid in one go. */
  byInstalment: boolean
}

/**
 * Raises the lines on a child's bill.
 *
 * Everything is pre-filled from the price list and everything stays editable,
 * because the school negotiates: a parent who cannot pay stationery in one go
 * pays it monthly, and transport depends on how far the child lives.
 */
export function BillBuilder({
  open, onClose, student,
}: {
  open: boolean
  onClose: () => void
  student: Student
}) {
  const { notify } = useToast()
  const { data: feeItems = [] } = useFeeItems()
  const { data: terms = [] } = useTerms()
  const createCharges = useCreateCharges()
  const term = currentTerm(terms)

  const [isNewAdmission, setIsNewAdmission] = useState(false)
  const [dueDate, setDueDate] = useState(todayIso())
  const [rows, setRows] = useState<Row[] | null>(null)

  const applicable = useMemo(
    () => itemsForStudent(feeItems, student.classId, { isNewAdmission }),
    [feeItems, student.classId, isNewAdmission],
  )

  // Rebuild the rows whenever the applicable set changes, keeping any edits.
  const current: Row[] = useMemo(() => {
    const previous = new Map((rows ?? []).map((r) => [r.item.key, r]))
    return applicable.map((item) => {
      const kept = previous.get(item.key)
      if (kept) return { ...kept, item }
      const quantity = item.cycle === 'daily' ? 20 : 1
      const unit = defaultAmountFor(item, student.classId)
      return {
        item,
        // Optional things (uniform, transport) start unticked — somebody chooses.
        include: !item.isOptional,
        amountText: unit === 0 ? '' : String((unit * quantity) / 100),
        quantity,
        byInstalment: false,
      }
    })
  }, [applicable]) // eslint-disable-line react-hooks/exhaustive-deps

  const effective = rows ?? current

  const update = (key: string, patch: Partial<Row>) =>
    setRows(effective.map((r) => (r.item.key === key ? { ...r, ...patch } : r)))

  const setDays = (key: string, days: number) => {
    const row = effective.find((r) => r.item.key === key)
    if (!row) return
    const unit = defaultAmountFor(row.item, student.classId)
    update(key, { quantity: days, amountText: String((unit * days) / 100) })
  }

  /** Switch a line between the whole-year price and one term's instalment. */
  const setInstalment = (key: string, byInstalment: boolean) => {
    const row = effective.find((r) => r.item.key === key)
    if (!row || row.item.instalmentAmountCents === null) return
    const cents = byInstalment
      ? row.item.instalmentAmountCents
      : defaultAmountFor(row.item, student.classId)
    update(key, { byInstalment, amountText: String(cents / 100) })
  }

  const chosen = effective.filter((r) => r.include)
  const total = chosen.reduce((sum, r) => sum + (parseKesToCents(r.amountText) ?? 0), 0)

  async function save() {
    const drafts: FeeChargeDraft[] = chosen.map((r) => ({
      studentId: student.id,
      itemKey: r.item.key,
      // Annual and one-off lines belong to no single term — unless the parent
      // is paying this one by instalments, in which case the line IS this term's.
      termId: r.item.cycle === 'term' || r.item.cycle === 'daily' || r.byInstalment
        ? term?.id ?? null
        : null,
      amountCents: parseKesToCents(r.amountText) ?? 0,
      dueDate,
      quantity: r.item.cycle === 'daily' ? r.quantity : null,
      notes: null,
      isWaived: false,
    }))

    if (drafts.length === 0) return
    try {
      await createCharges.mutateAsync(drafts)
      notify(`${drafts.length} ${drafts.length === 1 ? 'line' : 'lines'} added to ${student.firstName}'s bill.`)
      setRows(null)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not add those lines.', 'error')
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Set ${student.firstName}'s fees`}
      description={term ? `For ${term.name}` : 'No term set up yet'}
      footer={
        <Button
          block
          size="lg"
          disabled={chosen.length === 0}
          loading={createCharges.isPending}
          onClick={() => void save()}
        >
          {total > 0 ? `Add ${formatKes(total)} to the bill` : 'Add to the bill'}
        </Button>
      }
    >
      <div className="space-y-5 pb-4">
        <Toggle
          checked={isNewAdmission}
          onChange={setIsNewAdmission}
          label="This is a new admission"
          description="Adds the one-off joining items — admission fee and insurance — on top of the usual ones."
        />

        <div className="space-y-2">
          {effective.map((row) => {
            const cents = parseKesToCents(row.amountText) ?? 0
            return (
              <div
                key={row.item.key}
                className={cn(
                  'rounded-2xl border-2 p-3 transition-colors',
                  row.include ? 'border-iris-300 bg-white' : 'border-sand-200 bg-sand-50/60',
                )}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => update(row.item.key, { include: !row.include })}
                    aria-pressed={row.include}
                    className={cn(
                      'grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 transition-colors',
                      row.include
                        ? 'border-iris-500 bg-iris-500 text-white'
                        : 'border-sand-300 bg-white text-transparent',
                    )}
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span aria-hidden="true" className="text-xl">{row.item.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-extrabold text-sand-800">{row.item.label}</span>
                    <span className="block text-xs font-semibold text-sand-400">
                      {row.byInstalment ? 'this term only' : CYCLE_LABEL[row.item.cycle]}
                      {row.item.isOptional && ' · optional'}
                      {row.item.isNegotiated && ' · agreed per family'}
                    </span>
                  </span>
                </div>

                {row.include && row.item.instalmentAmountCents !== null && (
                  <div className="mt-3 flex gap-2 pl-10">
                    {[
                      { value: false, label: 'Whole year', cents: defaultAmountFor(row.item, student.classId) },
                      { value: true, label: 'This term', cents: row.item.instalmentAmountCents },
                    ].map((choice) => (
                      <button
                        key={String(choice.value)}
                        onClick={() => setInstalment(row.item.key, choice.value)}
                        className={cn(
                          'flex-1 rounded-xl border-2 px-3 py-2 text-sm font-extrabold transition-colors',
                          row.byInstalment === choice.value
                            ? 'border-iris-500 bg-iris-50 text-iris-700'
                            : 'border-sand-200 bg-white text-sand-500 hover:border-iris-300',
                        )}
                      >
                        {choice.label}
                        <span className="tnum mt-0.5 block text-xs font-bold opacity-70">
                          {formatKes(choice.cents)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {row.include && (
                  <div className="mt-3 flex flex-wrap items-end gap-2 pl-10">
                    {row.item.cycle === 'daily' && (
                      <label className="text-xs font-extrabold text-sand-500">
                        Days
                        <TextInput
                          type="number"
                          min={0}
                          value={row.quantity}
                          onChange={(e) => setDays(row.item.key, Number(e.target.value))}
                          className="mt-1 h-11 w-24 text-sm"
                        />
                      </label>
                    )}
                    <label className="flex-1 text-xs font-extrabold text-sand-500">
                      Amount (KES)
                      <TextInput
                        inputMode="decimal"
                        value={row.amountText}
                        onChange={(e) => update(row.item.key, { amountText: e.target.value })}
                        placeholder={row.item.isNegotiated ? 'Whatever you agreed' : '0'}
                        className="mt-1 h-11 text-sm"
                      />
                    </label>
                    {cents > 0 && (
                      <span className="tnum pb-3 text-sm font-extrabold text-sand-700">
                        {formatKes(cents)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <Field label="Due by">
          <TextInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value || todayIso())} />
        </Field>

        <p className="flex items-start gap-2.5 rounded-2xl bg-sand-50 px-4 py-3 text-sm leading-relaxed text-sand-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Every amount here is just the usual price — change any of them if you agreed something
          different with the parent. You can edit a line again later too.
        </p>
      </div>
    </Sheet>
  )
}

const CYCLE_LABEL: Record<FeeItem['cycle'], string> = {
  term: 'every term',
  year: 'once a year',
  once: 'one-off',
  daily: 'per day attended',
}
