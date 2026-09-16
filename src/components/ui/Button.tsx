import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'gold'
type Size = 'sm' | 'md' | 'lg'

/**
 * Touch targets are never smaller than 44px tall. Assume an imprecise finger on
 * a phone held in one hand while a three-year-old pulls the other.
 */
const SIZES: Record<Size, string> = {
  sm: 'min-h-[40px] px-3.5 text-sm gap-1.5 rounded-xl',
  md: 'min-h-[48px] px-4 text-[0.95rem] gap-2 rounded-2xl',
  lg: 'min-h-[56px] px-6 text-base gap-2.5 rounded-2xl',
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-iris-500 text-white shadow-glow hover:bg-iris-600 active:bg-iris-700',
  secondary: 'bg-sky-500 text-white shadow-glow-sky hover:bg-sky-600 active:bg-sky-700',
  soft: 'bg-iris-50 text-iris-700 hover:bg-iris-100 active:bg-iris-200 ring-1 ring-inset ring-iris-200/70',
  ghost: 'bg-transparent text-sand-600 hover:bg-sand-100 active:bg-sand-200',
  danger: 'bg-bad-soft text-bad-ink hover:bg-[#FBDCD8] active:bg-[#F7CCC6] ring-1 ring-inset ring-[#F3C9C3]',
  gold: 'bg-gold-400 text-gold-900 shadow-soft hover:bg-gold-300 active:bg-gold-500',
}

type BaseProps = {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  trailingIcon?: ReactNode
  block?: boolean
  loading?: boolean
  children?: ReactNode
  className?: string
}

const base =
  'inline-flex select-none items-center justify-center font-extrabold transition-all duration-150 ' +
  'ease-bounce active:scale-[.97] disabled:pointer-events-none disabled:opacity-45'

export const Button = forwardRef<HTMLButtonElement, BaseProps & ButtonHTMLAttributes<HTMLButtonElement>>(
  function Button(
    { variant = 'primary', size = 'md', icon, trailingIcon, block, loading, className, children, disabled, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, SIZES[size], VARIANTS[variant], block && 'w-full', className)}
        {...rest}
      >
        {loading ? <Spinner /> : icon}
        {children}
        {trailingIcon}
      </button>
    )
  },
)

export function ButtonLink({
  to, variant = 'primary', size = 'md', icon, trailingIcon, block, className, children,
}: BaseProps & { to: string }) {
  return (
    <Link
      to={to}
      className={cn(base, SIZES[size], VARIANTS[variant], block && 'w-full', className)}
    >
      {icon}
      {children}
      {trailingIcon}
    </Link>
  )
}

/** Big round action, bottom-right — the one thing you'd do on this screen. */
export function Fab({
  onClick, label, icon, className,
}: {
  onClick: () => void
  label: string
  icon: ReactNode
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'group fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-16 items-center gap-2.5',
        'rounded-full bg-iris-500 pl-5 pr-6 font-extrabold text-white shadow-glow transition-all duration-200',
        'ease-bounce hover:bg-iris-600 active:scale-95 lg:bottom-8 lg:right-8',
        className,
      )}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20 transition-transform duration-300 group-hover:rotate-90">
        {icon}
      </span>
      <span className="text-[0.95rem]">{label}</span>
    </button>
  )
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  )
}
