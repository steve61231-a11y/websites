import { useCallback, useEffect, useState } from 'react'
import type { ExpenseDraft, ExpenseCategoryKey, PaymentMethod } from '@/data/types'
import { todayIso } from '@/lib/dates'

const DRAFT_KEY = 'iris-fields:expense-draft'

export type Draft = {
  categoryKey: ExpenseCategoryKey | null
  customCategory: string
  amountCents: number
  vendorId: string | null
  vendorName: string
  paymentMethod: PaymentMethod | null
  date: string
  notes: string
}

export const emptyDraft = (): Draft => ({
  categoryKey: null,
  customCategory: '',
  amountCents: 0,
  vendorId: null,
  vendorName: '',
  paymentMethod: 'mpesa', // by far the most common way this school pays for anything
  date: todayIso(),
  notes: '',
})

/**
 * Keeps a half-finished expense alive across an interruption — a phone call,
 * a child at the door, an accidental back swipe. Losing a typed amount because
 * the screen locked is the fastest way to make someone stop using an app.
 */
export function useExpenseDraft() {
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return emptyDraft()
      const saved = JSON.parse(raw) as Partial<Draft>
      // A stale date would silently file today's shopping under last week.
      return { ...emptyDraft(), ...saved, date: saved.date ?? todayIso() }
    } catch {
      return emptyDraft()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      /* the flow still works, it just will not survive a reload */
    }
  }, [draft])

  const update = useCallback((patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }, [])

  const clear = useCallback(() => {
    setDraft(emptyDraft())
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  return { draft, update, clear }
}

export function draftIsComplete(draft: Draft): draft is Draft & {
  categoryKey: ExpenseCategoryKey
  paymentMethod: PaymentMethod
} {
  return (
    draft.categoryKey !== null &&
    draft.paymentMethod !== null &&
    draft.amountCents > 0 &&
    draft.vendorName.trim().length > 0
  )
}

export function toExpenseDraft(draft: Draft): ExpenseDraft {
  if (!draftIsComplete(draft)) throw new Error('That expense is not finished yet.')
  return {
    date: draft.date,
    categoryKey: draft.categoryKey,
    customCategory: draft.categoryKey === 'other' ? draft.customCategory.trim() || null : null,
    vendorId: draft.vendorId,
    vendorName: draft.vendorName.trim(),
    amountCents: draft.amountCents,
    paymentMethod: draft.paymentMethod,
    notes: draft.notes.trim() || null,
  }
}
