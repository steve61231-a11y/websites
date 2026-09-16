import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Pencil, Plus, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { CATEGORY_LIST, PAYMENT_METHODS, categoryToken, paymentMethodLabel } from '@/brand/categories'
import { formatKes } from '@/lib/money'
import { formatDate, formatRelativeDay, todayIso } from '@/lib/dates'
import { useCreateExpense, useCreateVendor, useVendors } from '@/data/queries'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { ChoiceChips, DateField, Field, TextArea, TextInput } from '@/components/ui/fields'
import { SuccessBurst } from '@/components/ui/SuccessBurst'
import {
  draftIsComplete, toExpenseDraft, useExpenseDraft, type Draft,
} from './useExpenseDraft'
import type { ExpenseCategoryKey, PaymentMethod } from '@/data/types'

const STEPS = ['Category', 'Amount', 'Details', 'Check'] as const
type Step = 0 | 1 | 2 | 3

/**
 * Adding an expense, as a four-tap wizard.
 *
 * Each screen asks exactly one thing and has exactly one obvious way forward.
 * Nothing here needs the phone keyboard except the optional note: the category
 * is a tile, the amount is a keypad, the vendor is a chip, the date is "Today".
 */
export default function AddExpensePage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { draft, update, clear } = useExpenseDraft()
  const [step, setStep] = useState<Step>(draft.categoryKey ? 1 : 0)
  const [saved, setSaved] = useState<{ amountCents: number } | null>(null)

  const createExpense = useCreateExpense()

  function goNext() {
    setStep((s) => Math.min(s + 1, 3) as Step)
  }

  function goBack() {
    if (step === 0) {
      navigate('/expenses')
      return
    }
    setStep((s) => Math.max(s - 1, 0) as Step)
  }

  async function save() {
    if (!draftIsComplete(draft)) return
    try {
      const amountCents = draft.amountCents
      await createExpense.mutateAsync(toExpenseDraft(draft))
      setSaved({ amountCents })
    } catch (err) {
      notify(err instanceof Error ? err.message : 'That did not save. Please try again.', 'error')
    }
  }

  return (
    <div className="mx-auto max-w-xl pb-6">
      <header className="mb-6 flex items-center gap-3">
        <button
          onClick={goBack}
          aria-label={step === 0 ? 'Cancel' : 'Back'}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-sand-600 shadow-soft transition-colors hover:text-iris-600"
        >
          {step === 0 ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-extrabold text-sand-900">Add an expense</h1>
          <p className="text-sm font-semibold text-sand-400">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </p>
        </div>
      </header>

      <div className="mb-7 flex gap-1.5" aria-hidden="true">
        {STEPS.map((_, i) => (
          <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-200">
            <motion.div
              className="h-full rounded-full bg-iris-500"
              initial={false}
              animate={{ width: i <= step ? '100%' : '0%' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 22 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -22 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {step === 0 && (
            <CategoryStep
              value={draft.categoryKey}
              customCategory={draft.customCategory}
              onCustomCategory={(customCategory) => update({ customCategory })}
              onPick={(categoryKey) => {
                // Changing category invalidates the vendor picked under the old one.
                update(
                  categoryKey === draft.categoryKey
                    ? { categoryKey }
                    : { categoryKey, vendorId: null, vendorName: '' },
                )
                goNext()
              }}
            />
          )}

          {step === 1 && (
            <AmountStep
              draft={draft}
              onChange={(amountCents) => update({ amountCents })}
              onNext={goNext}
            />
          )}

          {step === 2 && (
            <DetailsStep draft={draft} update={update} onNext={goNext} />
          )}

          {step === 3 && (
            <ReviewStep
              draft={draft}
              onEdit={(target) => setStep(target)}
              onSave={save}
              saving={createExpense.isPending}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {saved && (
          <SuccessBurst
            message="Saved!"
            sub={`${formatKes(saved.amountCents)} · ${
              draft.categoryKey ? categoryToken(draft.categoryKey).label : ''
            }`}
            onDone={() => {
              clear()
              navigate('/expenses')
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ----------------------------------------------------------- step 1: category */

function CategoryStep({
  value, onPick, customCategory, onCustomCategory,
}: {
  value: ExpenseCategoryKey | null
  onPick: (key: ExpenseCategoryKey) => void
  customCategory: string
  onCustomCategory: (value: string) => void
}) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-extrabold leading-tight text-sand-900">
        What was it for?
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {CATEGORY_LIST.map((token, i) => {
          const active = value === token.key
          return (
            <motion.button
              key={token.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.035 }}
              onClick={() => onPick(token.key)}
              style={active ? { backgroundColor: token.color, borderColor: token.color } : undefined}
              className={cn(
                'flex min-h-[7.5rem] flex-col items-start justify-between rounded-3xl border-2 p-4 text-left',
                'transition-all duration-150 ease-bounce active:scale-[.97]',
                active
                  ? 'text-white shadow-lift'
                  : 'border-sand-200 bg-white text-sand-800 hover:-translate-y-0.5 hover:shadow-lift',
              )}
            >
              <span
                aria-hidden="true"
                className="grid h-12 w-12 place-items-center rounded-2xl text-2xl"
                style={{ backgroundColor: active ? 'rgba(255,255,255,.22)' : token.soft }}
              >
                {token.emoji}
              </span>
              <span className="mt-3 text-[0.95rem] font-extrabold leading-tight">{token.label}</span>
            </motion.button>
          )
        })}
      </div>

      {value === 'other' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Field label="What should we call it?" hint="Optional">
            <TextInput
              value={customCategory}
              onChange={(e) => onCustomCategory(e.target.value)}
              placeholder="e.g. Licence renewal"
            />
          </Field>
        </motion.div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------- step 2: amount */

function AmountStep({
  draft, onChange, onNext,
}: {
  draft: Draft
  onChange: (cents: number) => void
  onNext: () => void
}) {
  const token = draft.categoryKey ? categoryToken(draft.categoryKey) : null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-extrabold leading-tight text-sand-900">
          How much?
        </h2>
        {token && (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-sand-500">
            <span aria-hidden="true">{token.emoji}</span> {token.label}
          </p>
        )}
      </div>

      <MoneyInput valueCents={draft.amountCents} onChange={onChange} />

      <Button
        size="lg"
        block
        disabled={draft.amountCents <= 0}
        onClick={onNext}
        trailingIcon={<ArrowRight className="h-5 w-5" />}
      >
        Continue
      </Button>
    </div>
  )
}

/* ------------------------------------------------------------ step 3: details */

function DetailsStep({
  draft, update, onNext,
}: {
  draft: Draft
  update: (patch: Partial<Draft>) => void
  onNext: () => void
}) {
  const { data: vendors = [] } = useVendors()
  const createVendor = useCreateVendor()
  const [showNote, setShowNote] = useState(draft.notes.length > 0)
  const [addingVendor, setAddingVendor] = useState(false)
  const [newVendor, setNewVendor] = useState('')

  const suggestions = useMemo(() => {
    if (!draft.categoryKey) return []
    return vendors
      .filter((v) => v.categoryKey === draft.categoryKey && !v.isArchived)
      // Most-used first: the chips reorder themselves around how the school works.
      .sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name))
      .slice(0, 8)
  }, [vendors, draft.categoryKey])

  async function addVendor() {
    const name = newVendor.trim()
    if (!name || !draft.categoryKey) return
    const vendor = await createVendor.mutateAsync({ categoryKey: draft.categoryKey, name })
    update({ vendorId: vendor.id, vendorName: vendor.name })
    setNewVendor('')
    setAddingVendor(false)
  }

  const ready = draft.vendorName.trim().length > 0 && draft.paymentMethod !== null

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-extrabold leading-tight text-sand-900">
        A few quick details
      </h2>

      <Field label="Who was it paid to?" required>
        <div className="flex flex-wrap gap-2.5">
          {suggestions.map((vendor) => {
            const active = draft.vendorId === vendor.id
            return (
              <button
                key={vendor.id}
                onClick={() => update({ vendorId: vendor.id, vendorName: vendor.name })}
                className={cn(
                  'min-h-[48px] rounded-2xl border-2 px-4 font-extrabold transition-all duration-150 ease-bounce active:scale-95',
                  active
                    ? 'border-iris-500 bg-iris-500 text-white shadow-glow'
                    : 'border-sand-200 bg-white text-sand-700 hover:border-iris-300',
                )}
              >
                {vendor.name}
              </button>
            )
          })}

          <button
            onClick={() => setAddingVendor((v) => !v)}
            className={cn(
              'flex min-h-[48px] items-center gap-1.5 rounded-2xl border-2 border-dashed px-4 font-extrabold transition-colors',
              addingVendor
                ? 'border-iris-400 bg-iris-50 text-iris-700'
                : 'border-sand-300 text-sand-500 hover:border-iris-300 hover:text-iris-600',
            )}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Other…
          </button>
        </div>

        {addingVendor && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex gap-2"
          >
            <TextInput
              autoFocus
              value={newVendor}
              onChange={(e) => setNewVendor(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void addVendor()}
              placeholder="Type the name…"
            />
            <Button
              onClick={() => void addVendor()}
              disabled={!newVendor.trim()}
              loading={createVendor.isPending}
              className="shrink-0"
            >
              Add
            </Button>
          </motion.div>
        )}

        {draft.vendorName && !addingVendor && (
          <p className="mt-2.5 text-sm font-bold text-sand-500">
            Paying <span className="text-sand-800">{draft.vendorName}</span>
          </p>
        )}
      </Field>

      <Field label="How was it paid?" required>
        <ChoiceChips
          ariaLabel="Payment method"
          columns={3}
          options={PAYMENT_METHODS.map((m) => ({ value: m.key, label: m.label, emoji: m.emoji }))}
          value={draft.paymentMethod}
          onChange={(paymentMethod) => update({ paymentMethod: paymentMethod as PaymentMethod })}
        />
      </Field>

      <Field label="When?">
        <DateField value={draft.date} onChange={(date) => update({ date })} max={todayIso()} />
      </Field>

      {showNote ? (
        <Field label="Note" hint="Optional">
          <TextArea
            value={draft.notes}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="Anything worth remembering about this one…"
            autoFocus
          />
        </Field>
      ) : (
        <button
          onClick={() => setShowNote(true)}
          className="flex items-center gap-2 text-sm font-extrabold text-iris-600 hover:text-iris-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add a note
        </button>
      )}

      <Button
        size="lg"
        block
        disabled={!ready}
        onClick={onNext}
        trailingIcon={<ArrowRight className="h-5 w-5" />}
      >
        Check it over
      </Button>
    </div>
  )
}

/* ------------------------------------------------------------- step 4: review */

function ReviewStep({
  draft, onEdit, onSave, saving,
}: {
  draft: Draft
  onEdit: (step: Step) => void
  onSave: () => void
  saving: boolean
}) {
  const token = draft.categoryKey ? categoryToken(draft.categoryKey) : null
  if (!token) return null

  const label =
    draft.categoryKey === 'other' && draft.customCategory.trim()
      ? draft.customCategory.trim()
      : token.label

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-extrabold leading-tight text-sand-900">
        Does this look right?
      </h2>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="overflow-hidden rounded-3xl bg-white shadow-lift"
      >
        <div className="flex items-center gap-4 px-5 py-5" style={{ backgroundColor: token.soft }}>
          <span
            aria-hidden="true"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl shadow-soft"
            style={{ backgroundColor: '#fff' }}
          >
            {token.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em]" style={{ color: token.ink }}>
              {label}
            </p>
            <p className="tnum mt-0.5 font-display text-[clamp(1.75rem,8vw,2.4rem)] font-extrabold leading-none text-sand-900">
              {formatKes(draft.amountCents)}
            </p>
          </div>
        </div>

        <dl className="divide-y divide-sand-100">
          <ReviewRow label="Paid to" value={draft.vendorName} onEdit={() => onEdit(2)} />
          <ReviewRow
            label="Paid by"
            value={draft.paymentMethod ? paymentMethodLabel(draft.paymentMethod) : '—'}
            onEdit={() => onEdit(2)}
          />
          <ReviewRow
            label="Date"
            value={`${formatDate(draft.date, 'long')} · ${formatRelativeDay(draft.date)}`}
            onEdit={() => onEdit(2)}
          />
          {draft.notes.trim() && (
            <ReviewRow label="Note" value={draft.notes.trim()} onEdit={() => onEdit(2)} />
          )}
        </dl>
      </motion.div>

      <Button
        size="lg"
        block
        loading={saving}
        onClick={onSave}
        icon={<Check className="h-5 w-5" />}
      >
        Save this expense
      </Button>

      <button
        onClick={() => onEdit(1)}
        className="mx-auto flex items-center gap-2 text-sm font-extrabold text-sand-500 hover:text-iris-600"
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
        Change the amount
      </button>
    </div>
  )
}

function ReviewRow({
  label, value, onEdit,
}: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <dt className="w-24 shrink-0 text-sm font-extrabold text-sand-400">{label}</dt>
      <dd className="min-w-0 flex-1 font-bold text-sand-800">{value}</dd>
      <button
        onClick={onEdit}
        aria-label={`Change ${label.toLowerCase()}`}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sand-400 transition-colors hover:bg-sand-100 hover:text-iris-600"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  )
}
