import {
  createContext, useCallback, useContext, useMemo, useState, type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/cn'

type ToastTone = 'success' | 'error' | 'info'
type Toast = { id: number; tone: ToastTone; message: string }

const ToastContext = createContext<{
  notify: (message: string, tone?: ToastTone) => void
} | null>(null)

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = nextId++
    setToasts((current) => [...current, { id, tone, message }])
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4200)
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className={cn(
                'pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3.5 shadow-lift',
                t.tone === 'success' && 'bg-good-base text-white',
                t.tone === 'error' && 'bg-bad-base text-white',
                t.tone === 'info' && 'bg-sand-800 text-white',
              )}
            >
              {t.tone === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />}
              {t.tone === 'error' && <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />}
              {t.tone === 'info' && <Info className="h-5 w-5 shrink-0" aria-hidden="true" />}
              <p className="text-[0.95rem] font-bold leading-snug">{t.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
