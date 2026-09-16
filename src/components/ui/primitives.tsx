import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { initialsOf } from '@/data/selectors'

/* -------------------------------------------------------------------- cards */

export function Card({
  className, children, as: As = 'div',
}: { className?: string; children: ReactNode; as?: 'div' | 'section' | 'article' }) {
  return <As className={cn('card p-5', className)}>{children}</As>
}

/** Cards that slide up in sequence as a page loads. */
export function StaggerList({
  children, className, delay = 0,
}: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.055, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  )
}

export const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 26 } },
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  )
}

/* ------------------------------------------------------------------- labels */

export function SectionTitle({
  children, action, hint,
}: { children: ReactNode; action?: ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-lg font-extrabold text-sand-900">{children}</h2>
        {hint && <p className="mt-0.5 text-sm text-sand-500">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

type PillTone = 'iris' | 'sky' | 'gold' | 'good' | 'warn' | 'bad' | 'muted'

const PILL_TONES: Record<PillTone, string> = {
  iris: 'bg-iris-50 text-iris-700 ring-iris-200',
  sky: 'bg-sky-50 text-sky-800 ring-sky-200',
  gold: 'bg-gold-100 text-gold-800 ring-gold-300',
  good: 'bg-good-soft text-good-ink ring-[#BFE5D1]',
  warn: 'bg-warn-soft text-warn-ink ring-[#F0DAAE]',
  bad: 'bg-bad-soft text-bad-ink ring-[#F3C9C3]',
  muted: 'bg-sand-100 text-sand-600 ring-sand-200',
}

export function Pill({
  tone = 'muted', children, icon, className,
}: { tone?: PillTone; children: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1',
        'text-xs font-extrabold ring-1 ring-inset',
        PILL_TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ avatars */

const AVATAR_TINTS = [
  'bg-iris-100 text-iris-700', 'bg-sky-100 text-sky-800', 'bg-gold-100 text-gold-800',
  'bg-good-soft text-good-ink', 'bg-[#FBEDF6] text-[#7C3A6A]', 'bg-[#FAF0E7] text-[#6C3B17]',
]

/** Deterministic tint per person, so the same face is always the same colour. */
function tintFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_TINTS[hash % AVATAR_TINTS.length]
}

export function Avatar({
  name, src, size = 'md', className,
}: { name: string; src?: string | null; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const dims = {
    sm: 'h-9 w-9 text-xs', md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-lg', xl: 'h-24 w-24 text-2xl',
  }[size]

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('shrink-0 rounded-2xl object-cover ring-2 ring-white shadow-soft', dims, className)}
      />
    )
  }
  return (
    <div
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-2xl font-extrabold ring-2 ring-white shadow-soft',
        dims, tintFor(name), className,
      )}
    >
      {initialsOf(name)}
    </div>
  )
}

/* ----------------------------------------------------------- empty & loading */

export function EmptyState({
  emoji, title, body, action, className,
}: { emoji: string; title: string; body: string; action?: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('card flex flex-col items-center px-6 py-12 text-center', className)}
    >
      <div className="grid h-20 w-20 place-items-center rounded-blob bg-iris-50 text-4xl">{emoji}</div>
      <h3 className="mt-5 font-display text-xl font-extrabold text-sand-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[0.95rem] leading-relaxed text-sand-500">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-sand-200/70', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  )
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card space-y-3 p-5">
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------- misc */

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-t hairline', className)} />
}

/** Key figure, sized to be read from across the room. */
export function BigNumber({
  value, label, tone = 'ink', className,
}: { value: ReactNode; label?: ReactNode; tone?: 'ink' | 'iris' | 'good' | 'bad'; className?: string }) {
  const tones = {
    ink: 'text-sand-900', iris: 'text-iris-600', good: 'text-good-ink', bad: 'text-bad-ink',
  }
  return (
    <div className={className}>
      {label && (
        <div className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-sand-400">{label}</div>
      )}
      <div className={cn('tnum mt-1 font-display text-[clamp(1.9rem,7vw,2.75rem)] font-extrabold leading-none', tones[tone])}>
        {value}
      </div>
    </div>
  )
}
