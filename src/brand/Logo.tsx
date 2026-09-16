import { motion } from 'framer-motion'
import { MARK_PATHS, MARK_VIEWBOX, type MarkRole } from './markPaths'
import { cn } from '@/lib/cn'

const ROLE_COLOR: Record<MarkRole, string> = {
  petalTop: '#665EC7',
  petalCore: '#F1D058',
  leaf: '#00AEEF',
}

/** Order the petals bloom in: outer purple, then gold heart, then the blue leaves. */
const ROLE_ORDER: MarkRole[] = ['petalTop', 'petalCore', 'leaf']

type MarkProps = {
  className?: string
  /** Animate the petals in one after another. Used on the login + splash screens. */
  animate?: boolean
  title?: string
}

export function LogoMark({ className, animate = false, title = 'Iris Fields School' }: MarkProps) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      className={cn('block', className)}
      role="img"
      aria-label={title}
    >
      {MARK_PATHS.map((p, i) =>
        animate ? (
          <motion.path
            key={i}
            d={p.d}
            fill={ROLE_COLOR[p.role]}
            initial={{ opacity: 0, scale: 0.6, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              delay: 0.06 * ROLE_ORDER.indexOf(p.role) + 0.02 * i,
              type: 'spring',
              stiffness: 260,
              damping: 18,
            }}
            style={{ transformOrigin: '50% 60%' }}
          />
        ) : (
          <path key={i} d={p.d} fill={ROLE_COLOR[p.role]} />
        ),
      )}
    </svg>
  )
}

/**
 * The hand-lettered wordmark, kept as artwork (never as a UI font — body text
 * uses Nunito, which is far easier to read on a phone in a busy classroom).
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}wordmark.svg`}
      alt="Iris Fields School"
      className={cn('block h-auto select-none', className)}
      draggable={false}
    />
  )
}

/** Mark + typeset name, for nav bars and headers where the artwork would be too tall. */
export function LogoLockup({
  className,
  markClassName,
  subtitle,
}: {
  className?: string
  markClassName?: string
  subtitle?: string
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className={cn('h-9 w-9 shrink-0', markClassName)} />
      <div className="min-w-0 leading-none">
        <div className="font-display text-[1.05rem] font-extrabold tracking-tight text-iris-700">
          Iris Fields
        </div>
        <div className="mt-0.5 truncate text-[0.7rem] font-bold uppercase tracking-[0.16em] text-sand-400">
          {subtitle ?? 'School'}
        </div>
      </div>
    </div>
  )
}
