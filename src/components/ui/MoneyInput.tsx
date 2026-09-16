import { useEffect, useRef, useState } from 'react'
import { Delete } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatKes, type Cents } from '@/lib/money'

/**
 * Amount entry, designed around the fact that money is the one field nobody can
 * afford to fumble.
 *
 * Digits are appended right-to-left like a till or an M-Pesa prompt — you type
 * 4 5 2 0 0 and see KES 452.00 build up — so there is no decimal point to miss
 * and no way to typo a stray "." into a ten-fold error. On phones the app draws
 * its own keypad rather than trusting the OS keyboard to show numbers.
 */
export function MoneyInput({
  valueCents, onChange, autoFocus = true, showKeypad = true,
}: {
  valueCents: Cents
  onChange: (next: Cents) => void
  autoFocus?: boolean
  showKeypad?: boolean
}) {
  const [flash, setFlash] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 150)
    return () => clearTimeout(t)
  }, [valueCents])

  /**
   * Appends one or more digits in a single update. It has to take the whole
   * string at once: the "00" key pressing push('0') twice would read the same
   * stale `valueCents` both times and only ever add one zero.
   */
  const push = (digits: string) => {
    let next = valueCents
    for (const digit of digits) next = next * 10 + Number(digit)
    // A kindergarten does not spend ten million shillings in one go; this is a
    // guard against a finger resting on a key, not a business rule.
    if (next > 1_000_000_000) return
    onChange(next)
  }

  const backspace = () => onChange(Math.floor(valueCents / 10))

  useEffect(() => {
    if (!autoFocus) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (/^\d$/.test(e.key)) {
        e.preventDefault()
        push(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        backspace()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const [shillings, cents] = formatKes(valueCents, { prefix: false }).includes('.')
    ? formatKes(valueCents, { prefix: false }).split('.')
    : [formatKes(valueCents, { prefix: false }), '00']

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'flex items-baseline justify-center gap-2 rounded-3xl bg-white px-4 py-6 ring-2 ring-inset transition-all duration-150',
          valueCents > 0 ? 'ring-iris-300' : 'ring-sand-200',
          flash && 'scale-[1.015]',
        )}
        aria-live="polite"
      >
        <span className="font-display text-xl font-extrabold text-sand-400">KES</span>
        <span
          className={cn(
            'tnum font-display text-[clamp(2.4rem,12vw,3.6rem)] font-extrabold leading-none tracking-tight',
            valueCents > 0 ? 'text-sand-900' : 'text-sand-300',
          )}
        >
          {shillings}
        </span>
        <span className={cn('tnum font-display text-2xl font-extrabold', valueCents > 0 ? 'text-sand-400' : 'text-sand-300')}>
          .{cents}
        </span>
      </div>

      {showKeypad && (
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <Key key={d} onClick={() => push(d)}>{d}</Key>
          ))}
          <Key onClick={() => push('00')} className="text-xl">00</Key>
          <Key onClick={() => push('0')}>0</Key>
          <Key onClick={backspace} ariaLabel="Delete last digit" className="bg-sand-100 text-sand-600">
            <Delete className="h-6 w-6" aria-hidden="true" />
          </Key>
        </div>
      )}
    </div>
  )
}

function Key({
  children, onClick, className, ariaLabel,
}: {
  children: React.ReactNode
  onClick: () => void
  className?: string
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'h-16 rounded-2xl bg-white font-display text-2xl font-extrabold text-sand-800 shadow-soft',
        'transition-all duration-100 ease-bounce active:scale-95 active:bg-iris-50 active:shadow-press',
        className,
      )}
    >
      {children}
    </button>
  )
}
