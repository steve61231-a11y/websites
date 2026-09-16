import { useMemo, useState } from 'react'
import {
  addDays, addMonths, endOfMonth, formatDate, startOfMonth, startOfQuarter, startOfWeek, todayIso,
  type IsoDate,
} from '@/lib/dates'
import type { DateRange } from '@/data/selectors'

export type PeriodKey = 'week' | 'month' | 'quarter' | 'custom'

export const PERIOD_OPTIONS: Array<{ value: PeriodKey; label: string }> = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'quarter', label: 'This quarter' },
  { value: 'custom', label: 'Custom' },
]

function rangeFor(key: PeriodKey, today: IsoDate, custom: { from: IsoDate; to: IsoDate }): DateRange {
  switch (key) {
    case 'week':
      return { from: startOfWeek(today), to: today, label: 'this week' }
    case 'quarter':
      return { from: startOfQuarter(today), to: today, label: 'this quarter' }
    case 'custom':
      return {
        from: custom.from,
        to: custom.to,
        label: `${formatDate(custom.from, 'short')} – ${formatDate(custom.to, 'short')}`,
      }
    case 'month':
    default:
      return { from: startOfMonth(today), to: today, label: 'this month' }
  }
}

/** The equivalent window one period earlier, for the "↑12% vs last month" line. */
function previousRangeFor(key: PeriodKey, today: IsoDate, current: DateRange): DateRange {
  switch (key) {
    case 'week':
      return { from: addDays(current.from, -7), to: addDays(current.to, -7), label: 'last week' }
    case 'quarter':
      return { from: addMonths(current.from, -3), to: addMonths(current.to, -3), label: 'last quarter' }
    case 'custom': {
      const span = Math.max(1, Math.round(
        (Date.parse(`${current.to}T12:00:00Z`) - Date.parse(`${current.from}T12:00:00Z`)) / 86_400_000,
      ) + 1)
      return {
        from: addDays(current.from, -span),
        to: addDays(current.from, -1),
        label: 'the period before',
      }
    }
    case 'month':
    default: {
      const prevStart = startOfMonth(addMonths(today, -1))
      // Compare like with like: the 1st–16th of last month, not the whole month.
      const dayOfMonth = Number(today.slice(8, 10))
      const prevEnd = endOfMonth(prevStart)
      const cappedEnd = addDays(prevStart, dayOfMonth - 1)
      return { from: prevStart, to: cappedEnd < prevEnd ? cappedEnd : prevEnd, label: 'last month' }
    }
  }
}

export function usePeriod(initial: PeriodKey = 'month') {
  const today = todayIso()
  const [key, setKey] = useState<PeriodKey>(initial)
  const [custom, setCustom] = useState({ from: startOfMonth(today), to: today })

  const range = useMemo(() => rangeFor(key, today, custom), [key, today, custom])
  const previous = useMemo(() => previousRangeFor(key, today, range), [key, today, range])

  return { key, setKey, range, previous, custom, setCustom }
}
