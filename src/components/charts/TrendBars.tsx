import { useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { formatKes, formatKesShort } from '@/lib/money'
import { formatDate } from '@/lib/dates'
import type { TrendPoint } from '@/data/selectors'

/**
 * Spend over the selected period. One measure, one axis — never two scales on
 * one chart. Bars carry a 4px rounded top anchored to the baseline, a 2px gap
 * between neighbours, and a recessive horizontal grid.
 */
export function TrendBars({
  points, color = '#665EC7', height = 200,
}: {
  points: TrendPoint[]
  color?: string
  height?: number
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const data = useMemo(
    () => points.map((p) => ({ ...p, amount: p.totalCents / 100 })),
    [points],
  )

  const busiest = useMemo(() => {
    let best = -1
    let bestValue = 0
    points.forEach((p, i) => {
      if (p.totalCents > bestValue) {
        bestValue = p.totalCents
        best = i
      }
    })
    return best
  }, [points])

  if (points.every((p) => p.totalCents === 0)) {
    return (
      <div className="grid h-40 place-items-center rounded-3xl bg-sand-50 text-sm font-semibold text-sand-400">
        No spending recorded in this period.
      </div>
    )
  }

  return (
    <div style={{ height }} onMouseLeave={() => setActiveIndex(null)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }} barCategoryGap="18%">
          <CartesianGrid vertical={false} stroke="#E8E5DE" strokeDasharray="0" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={14}
            tick={{ fill: '#8A8276', fontSize: 11, fontWeight: 700 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v: number) => formatKesShort(v * 100)}
            tick={{ fill: '#8A8276', fontSize: 11, fontWeight: 700 }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(102,94,199,0.07)', radius: 8 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const point = payload[0].payload as TrendPoint
              return (
                <div className="rounded-2xl bg-sand-900 px-3.5 py-2.5 text-white shadow-lift">
                  <p className="text-[0.7rem] font-bold uppercase tracking-wide text-sand-300">
                    {formatDate(point.bucket, 'medium')}
                  </p>
                  <p className="tnum mt-0.5 font-display text-base font-extrabold">
                    {formatKes(point.totalCents)}
                  </p>
                </div>
              )
            }}
          />
          <Bar
            dataKey="amount"
            radius={[4, 4, 0, 0]}
            animationDuration={700}
            onMouseEnter={(_: unknown, index: number) => setActiveIndex(index)}
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={color}
                /* The busiest bar stays solid; the rest recede unless hovered. */
                opacity={activeIndex === null ? (index === busiest ? 1 : 0.72) : activeIndex === index ? 1 : 0.4}
                className="transition-opacity duration-150"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
