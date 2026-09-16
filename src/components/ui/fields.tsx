import {
  forwardRef, useId, type InputHTMLAttributes, type ReactNode,
  type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from 'react'
import { Search, X, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { addDays, formatRelativeDay, todayIso, type IsoDate } from '@/lib/dates'

const controlBase =
  'w-full rounded-2xl border-2 border-sand-200 bg-white px-4 text-[1rem] font-semibold text-sand-900 ' +
  'placeholder:font-normal placeholder:text-sand-400 transition-colors duration-150 ' +
  'focus:border-iris-400 focus:outline-none focus:ring-4 focus:ring-iris-100'

export function Field({
  label, hint, error, children, required, className, htmlFor,
}: {
  label?: ReactNode
  hint?: ReactNode
  error?: string | null
  children: ReactNode
  required?: boolean
  className?: string
  htmlFor?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label htmlFor={htmlFor} className="flex items-baseline gap-1.5 text-sm font-extrabold text-sand-700">
          {label}
          {required && <span className="text-bad-base">*</span>}
          {hint && <span className="ml-auto text-xs font-semibold text-sand-400">{hint}</span>}
        </label>
      )}
      {children}
      {error && (
        <p role="alert" className="text-sm font-bold text-bad-base">
          {error}
        </p>
      )}
    </div>
  )
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(controlBase, 'h-[52px]', className)} {...rest} />
  },
)

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className, rows = 3, ...rest }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(controlBase, 'py-3 leading-relaxed', className)} {...rest} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(controlBase, 'h-[52px] appearance-none pr-11', className)}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sand-400"
          aria-hidden="true"
        />
      </div>
    )
  },
)

/* ---------------------------------------------------------------- date field */

/**
 * A date that defaults to today and can be moved with one tap. Typing a date is
 * the slow path — the chips cover what people actually pick.
 */
export function DateField({
  value, onChange, max, min, id,
}: {
  value: IsoDate
  onChange: (next: IsoDate) => void
  max?: IsoDate
  min?: IsoDate
  id?: string
}) {
  const today = todayIso()
  const quick: Array<{ label: string; value: IsoDate }> = [
    { label: 'Today', value: today },
    { label: 'Yesterday', value: addDays(today, -1) },
  ]

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2">
        {quick.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => onChange(q.value)}
            className={cn(
              'min-h-[44px] rounded-2xl px-4 text-sm font-extrabold transition-all duration-150 ease-bounce active:scale-95',
              value === q.value
                ? 'bg-iris-500 text-white shadow-glow'
                : 'bg-white text-sand-600 ring-2 ring-inset ring-sand-200 hover:ring-iris-300',
            )}
          >
            {q.label}
          </button>
        ))}
        <div className="relative min-w-[9.5rem] flex-1">
          <input
            id={id}
            type="date"
            value={value}
            max={max}
            min={min}
            onChange={(e) => e.target.value && onChange(e.target.value)}
            className={cn(controlBase, 'h-[44px] px-3 text-sm')}
          />
        </div>
      </div>
      <p className="text-sm font-semibold text-sand-500">{formatRelativeDay(value)}</p>
    </div>
  )
}

/* -------------------------------------------------------------- choice chips */

export type Choice<T extends string> = {
  value: T
  label: string
  emoji?: string
  color?: string
}

/* Static class names — Tailwind cannot see a template-literal column count. */
const CHIP_COLUMNS = {
  1: 'grid grid-cols-1 gap-2.5',
  2: 'grid grid-cols-2 gap-2.5',
  3: 'grid grid-cols-3 gap-2.5',
} as const

/** Big tappable chips. The default way to pick anything with a known set of options. */
export function ChoiceChips<T extends string>({
  options, value, onChange, columns, size = 'md', ariaLabel,
}: {
  options: ReadonlyArray<Choice<T>>
  value: T | null
  onChange: (value: T) => void
  columns?: 1 | 2 | 3
  size?: 'sm' | 'md'
  ariaLabel?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(columns ? CHIP_COLUMNS[columns] : 'flex flex-wrap gap-2.5')}
    >
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            style={
              active && opt.color
                ? { backgroundColor: opt.color, borderColor: opt.color, color: '#fff' }
                : undefined
            }
            className={cn(
              'flex items-center justify-center gap-2 rounded-2xl border-2 font-extrabold',
              'transition-all duration-150 ease-bounce active:scale-[.96]',
              size === 'sm' ? 'min-h-[44px] px-3.5 text-sm' : 'min-h-[52px] px-4 text-[0.95rem]',
              active
                ? opt.color
                  ? 'text-white shadow-lift'
                  : 'border-iris-500 bg-iris-500 text-white shadow-glow'
                : 'border-sand-200 bg-white text-sand-700 hover:border-iris-300 hover:bg-iris-50/50',
            )}
          >
            {opt.emoji && <span aria-hidden="true" className="text-lg leading-none">{opt.emoji}</span>}
            <span className="truncate">{opt.label}</span>
            {active && !opt.emoji && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------- search input */

export function SearchInput({
  value, onChange, placeholder = 'Search…', className, autoFocus,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}) {
  const id = useId()
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sand-400" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(controlBase, 'h-[52px] pl-12 pr-11 font-semibold')}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-sand-400 hover:bg-sand-100 hover:text-sand-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------- toggle */

export function Toggle({
  checked, onChange, label, description,
}: { checked: boolean; onChange: (next: boolean) => void; label: string; description?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-4 rounded-2xl border-2 border-sand-200 bg-white p-4 text-left transition-colors hover:border-iris-300"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold text-sand-800">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-sand-500">{description}</span>}
      </span>
      <span
        className={cn(
          'relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-iris-500' : 'bg-sand-300',
        )}
      >
        <span
          className={cn(
            'absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ease-bounce',
            checked ? 'translate-x-7' : 'translate-x-1',
          )}
        />
      </span>
    </button>
  )
}
