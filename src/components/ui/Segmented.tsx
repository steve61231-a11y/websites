import { motion } from 'framer-motion'
import { useId } from 'react'
import { cn } from '@/lib/cn'

/**
 * Period / view switcher. The active pill physically slides between options
 * (shared layout animation) so the change of state is impossible to miss.
 */
export function Segmented<T extends string>({
  options, value, onChange, ariaLabel, className, size = 'md',
}: {
  options: ReadonlyArray<{ value: T; label: string }>
  value: T
  onChange: (next: T) => void
  ariaLabel: string
  className?: string
  size?: 'sm' | 'md'
}) {
  const layoutId = useId()
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'scroll-x flex gap-1 overflow-x-auto rounded-2xl bg-sand-100 p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative flex-1 whitespace-nowrap rounded-xl font-extrabold transition-colors duration-150',
              size === 'sm' ? 'min-h-[38px] px-3 text-[0.8rem]' : 'min-h-[44px] px-4 text-sm',
              active ? 'text-iris-700' : 'text-sand-500 hover:text-sand-700',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                className="absolute inset-0 rounded-xl bg-white shadow-soft"
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
