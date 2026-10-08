import { useEffect, useRef, useState } from 'react'
import { Delete } from 'lucide-react'
import { cn } from '@/lib/cn'
import { appendShillings, dropLastShilling, formatKes, type Cents } from '@/lib/money'

/**
 * Amount entry, designed around the fact that money is the one field nobody can
 * afford to fumble.
 *
 * Digits are whole shillings: typing 2 0 0 0 0 gives KES 20,000. Nobody at this
 * school deals in cents, and making people key two extra zeros for every single
 * amount was the fastest way to make the app annoying. Values are still stored
 * as integer cents underneath — the keypad simply never produces a fraction.
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

  const push = (digits: string) => onChange(appendShillings(valueCents, digits))
  const backspace = () => onChange(dropLastShilling(valueCents))

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

  const shillings = formatKes(valueCents, { prefix: false })

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
      </div>

      {showKeypad && (
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <Key key={d} onClick={() => push(d)}>{d}</Key>
          ))}
          <Key onClick={() => push('000')} className="text-xl">000</Key>
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
