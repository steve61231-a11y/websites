import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'

/** Every page opens the same way: where am I, what is this, what can I do here. */
export function PageHeader({
  title, subtitle, emoji, action, backTo, className,
}: {
  title: string
  subtitle?: ReactNode
  emoji?: string
  action?: ReactNode
  backTo?: string | -1
  className?: string
}) {
  const navigate = useNavigate()
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('mb-5 flex items-start gap-3', className)}
    >
      {backTo !== undefined && (
        <button
          onClick={() => (backTo === -1 ? navigate(-1) : navigate(backTo))}
          aria-label="Go back"
          className="-ml-1 mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-sand-600 shadow-soft transition-colors hover:text-iris-600"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="flex items-center gap-2 font-display text-[1.6rem] font-extrabold leading-tight text-sand-900 sm:text-3xl">
          {emoji && <span aria-hidden="true">{emoji}</span>}
          <span className="truncate">{title}</span>
        </h1>
        {subtitle && <div className="mt-1 text-[0.95rem] text-sand-500">{subtitle}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.header>
  )
}
