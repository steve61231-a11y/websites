import type { ExpenseCategoryKey } from '@/data/types'

/**
 * Expense category tokens — colour, icon and label, defined once and used
 * *everywhere* a category appears (chips, chart slices, list rows, summary cards).
 *
 * The colour order below is not cosmetic. It was validated with the data-viz
 * palette checker against the app's light chart surface and passes every gate:
 * lightness band, chroma floor, colour-blind separation (worst adjacent pair
 * ΔE 8.6 protan) and the normal-vision floor (worst 16.2). Re-run the checker
 * before changing a colour or inserting a new category into the middle.
 *
 * Three of the hues sit below 3:1 contrast on white, so the "relief rule"
 * applies: every chart in this app ships direct labels + a legend + an icon, so
 * a category is never identified by colour alone.
 */
export type CategoryToken = {
  key: ExpenseCategoryKey
  label: string
  /** Short form for chart legends and narrow chips. */
  short: string
  emoji: string
  color: string
  /** Tints for chips, tiles and row markers. */
  soft: string
  border: string
  ink: string
}

export const CATEGORY_TOKENS: Record<ExpenseCategoryKey, CategoryToken> = {
  supermarket: {
    key: 'supermarket', label: 'Supermarket Supplies', short: 'Supermarket', emoji: '🛒',
    color: '#1BAF7A', soft: '#E7F7F0', border: '#B9E7D6', ink: '#0F6E4C',
  },
  groceries: {
    key: 'groceries', label: 'Groceries & Food', short: 'Groceries', emoji: '🍚',
    color: '#D99A1F', soft: '#FDF4E1', border: '#F3DFB0', ink: '#8A6110',
  },
  fuel: {
    key: 'fuel', label: 'Fuel', short: 'Fuel', emoji: '⛽',
    color: '#E2553D', soft: '#FDEDEA', border: '#F7CEC6', ink: '#8F3323',
  },
  salaries: {
    key: 'salaries', label: 'Salaries', short: 'Salaries', emoji: '💰',
    color: '#665EC7', soft: '#F0EFFB', border: '#CFCBF1', ink: '#403A85',
  },
  water: {
    key: 'water', label: 'Water', short: 'Water', emoji: '💧',
    color: '#0E9DD9', soft: '#E6F6FD', border: '#B6E3F7', ink: '#0A6289',
  },
  repairs: {
    key: 'repairs', label: 'Repairs & Maintenance', short: 'Repairs', emoji: '🔧',
    color: '#A55C24', soft: '#FAF0E7', border: '#EBD2BB', ink: '#6C3B17',
  },
  other: {
    key: 'other', label: 'Other', short: 'Other', emoji: '➕',
    color: '#C15FA8', soft: '#FBEDF6', border: '#F0CCE4', ink: '#7C3A6A',
  },
}

/** Canonical display + chart-series order. Do not re-order without re-validating. */
export const CATEGORY_ORDER: ExpenseCategoryKey[] = [
  'supermarket', 'groceries', 'fuel', 'salaries', 'water', 'repairs', 'other',
]

export const CATEGORY_LIST: CategoryToken[] = CATEGORY_ORDER.map((k) => CATEGORY_TOKENS[k])

export function categoryToken(key: string): CategoryToken {
  return CATEGORY_TOKENS[key as ExpenseCategoryKey] ?? CATEGORY_TOKENS.other
}

/** Payment methods — the same three everywhere money moves, in or out. */
export const PAYMENT_METHODS = [
  { key: 'mpesa', label: 'M-Pesa', emoji: '📱' },
  { key: 'cash', label: 'Cash', emoji: '💵' },
  { key: 'bank', label: 'Bank', emoji: '🏦' },
] as const

export function paymentMethodLabel(key: string): string {
  return PAYMENT_METHODS.find((m) => m.key === key)?.label ?? key
}
