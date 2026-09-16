import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { formatKes } from '@/lib/money'
import { categoryToken } from '@/brand/categories'
import type { CategorySlice } from '@/data/selectors'
import type { ExpenseCategoryKey } from '@/data/types'

/**
 * Where the money went. A donut rather than a pie so the period total can live
 * in the middle, which is the number people actually came to read.
 *
 * Identity is never carried by colour alone: every slice has a matching row
 * below it with its icon, name, amount and share — that row list doubles as the
 * legend and as the table view the accessibility rules ask for.
 */
export function CategoryDonut({
  slices, totalCents, selected, onSelect,
}: {
  slices: CategorySlice[]
  totalCents: number
  selected: ExpenseCategoryKey | null
  onSelect: (key: ExpenseCategoryKey | null) => void
}) {
  const [hovered, setHovered] = useState<ExpenseCategoryKey | null>(null)
  const active = hovered ?? selected
  const activeSlice = slices.find((s) => s.key === active) ?? null

  // `key` is reserved by React, so the slice identity travels as `categoryKey`.
  const data = useMemo(
    () => slices.map((s) => ({ categoryKey: s.key, value: s.totalCents })),
    [slices],
  )

  if (slices.length === 0) {
    return (
      <div className="grid h-56 place-items-center rounded-3xl bg-sand-50 text-sm font-semibold text-sand-400">
        Nothing spent in this period yet.
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:items-center">
      <div className="relative mx-auto aspect-square w-full max-w-[15rem]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="categoryKey"
              innerRadius="62%"
              outerRadius="96%"
              /* A 2px surface gap between fills keeps adjacent slices readable. */
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              animationDuration={750}
              animationBegin={80}
              onClick={(_, index) => {
                const clicked = slices[index]?.key ?? null
                onSelect(clicked === selected ? null : clicked)
              }}
            >
              {data.map((slice) => {
                const token = categoryToken(slice.categoryKey)
                const dimmed = active !== null && active !== slice.categoryKey
                return (
                  <Cell
                    key={slice.categoryKey}
                    fill={token.color}
                    opacity={dimmed ? 0.28 : 1}
                    className="cursor-pointer outline-none transition-opacity duration-200"
                    onMouseEnter={() => setHovered(slice.categoryKey)}
                    onMouseLeave={() => setHovered(null)}
                  />
                )
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div className="px-6">
            {activeSlice ? (
              <>
                <p className="text-2xl" aria-hidden="true">{categoryToken(activeSlice.key).emoji}</p>
                <p className="tnum mt-0.5 font-display text-xl font-extrabold leading-none text-sand-900">
                  {formatKes(activeSlice.totalCents, { prefix: false })}
                </p>
                <p className="mt-1 text-xs font-extrabold text-sand-400">
                  {Math.round(activeSlice.share * 100)}% · {categoryToken(activeSlice.key).short}
                </p>
              </>
            ) : (
              <>
                <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-sand-400">
                  Total
                </p>
                <p className="tnum mt-1 font-display text-xl font-extrabold leading-none text-sand-900">
                  {formatKes(totalCents, { prefix: false })}
                </p>
                <p className="mt-1 text-xs font-bold text-sand-400">KES</p>
              </>
            )}
          </div>
        </div>
      </div>

      <ul className="space-y-1.5">
        {slices.map((slice, i) => {
          const token = categoryToken(slice.key)
          const isSelected = selected === slice.key
          return (
            <motion.li
              key={slice.key}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 * i + 0.2 }}
            >
              <button
                onClick={() => onSelect(isSelected ? null : slice.key)}
                onMouseEnter={() => setHovered(slice.key)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors',
                  isSelected ? 'bg-sand-100' : 'hover:bg-sand-50',
                )}
              >
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: token.color }}
                />
                <span aria-hidden="true" className="shrink-0 text-base">{token.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-sand-800">{token.short}</span>
                  <span className="block text-xs font-semibold text-sand-400">
                    {slice.count} {slice.count === 1 ? 'entry' : 'entries'}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="tnum block text-sm font-extrabold text-sand-900">
                    {formatKes(slice.totalCents, { prefix: false })}
                  </span>
                  <span className="tnum block text-xs font-bold text-sand-400">
                    {Math.round(slice.share * 100)}%
                  </span>
                </span>
              </button>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}
