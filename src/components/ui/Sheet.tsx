import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

/**
 * One dialog component for the whole app: a bottom sheet on a phone (thumb can
 * reach it, dismiss by swiping down the way every other app works) and a
 * centred card on desktop.
 */
export function Sheet({
  open, onClose, title, description, children, footer, size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Move focus into the panel so a keyboard user is not left behind the overlay.
    const timer = setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>(
        'input, textarea, select, button, [tabindex]:not([tabindex="-1"])',
      )?.focus()
    }, 80)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      clearTimeout(timer)
    }
  }, [open, onClose])

  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.button
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-sand-900/40 backdrop-blur-[3px]"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%', opacity: 0.6, scale: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.4 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 130 || info.velocity.y > 700) onClose()
            }}
            className={cn(
              'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-blob bg-sand-50 shadow-lift',
              'sm:rounded-blob',
              widths[size],
            )}
          >
            <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-sand-300 sm:hidden" />

            <header className="flex items-start gap-3 px-5 pb-3 pt-4 sm:px-7 sm:pt-7">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl font-extrabold text-sand-900">{title}</h2>
                {description && <p className="mt-1 text-sm text-sand-500">{description}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sand-500 transition-colors hover:bg-sand-200/70 hover:text-sand-800"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-7">{children}</div>

            {footer && (
              <footer className="safe-b border-t hairline bg-white/80 px-5 py-4 backdrop-blur sm:px-7">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** Destructive actions always ask first — and say exactly what will be lost. */
export function ConfirmDialog({
  open, onClose, onConfirm, title, body, confirmLabel = 'Delete', busy,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  body: string
  confirmLabel?: string
  busy?: boolean
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" block onClick={onClose}>Cancel</Button>
          <Button variant="danger" block loading={busy} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      }
    >
      <p className="pb-2 text-[0.95rem] leading-relaxed text-sand-600">{body}</p>
    </Sheet>
  )
}
