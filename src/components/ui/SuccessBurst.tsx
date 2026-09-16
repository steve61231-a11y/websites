import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'

const BRAND = ['#665EC7', '#00AEEF', '#F1D058', '#8B82D8', '#5CD1F7']

/**
 * The moment after saving. A drawn tick plus a short scatter of brand-coloured
 * petals — enough to feel like something happened, short enough that it never
 * stands between the user and the next thing they came to do (~1.1s, then it
 * gets out of the way on its own).
 */
export function SuccessBurst({
  message, sub, onDone, duration = 1150,
}: {
  message: string
  sub?: string
  onDone: () => void
  duration?: number
}) {
  useEffect(() => {
    const t = setTimeout(onDone, duration)
    return () => clearTimeout(t)
  }, [onDone, duration])

  const petals = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2 + (i % 2) * 0.22
        const distance = 96 + (i % 4) * 26
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          color: BRAND[i % BRAND.length],
          size: 8 + (i % 3) * 4,
          rotate: (i % 2 ? 1 : -1) * (120 + i * 18),
        }
      }),
    [],
  )

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] grid place-items-center bg-sand-50/92 backdrop-blur-sm"
      role="status"
      aria-live="assertive"
    >
      <div className="relative grid place-items-center">
        {petals.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-[40%_60%_55%_45%]"
            style={{ width: p.size, height: p.size * 1.35, backgroundColor: p.color }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
            animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], scale: 1, rotate: p.rotate }}
            transition={{ duration: 0.95, ease: [0.22, 0.9, 0.3, 1] }}
          />
        ))}

        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 16 }}
          className="grid h-28 w-28 place-items-center rounded-blob bg-good-base shadow-lift"
        >
          <svg viewBox="0 0 52 52" className="h-14 w-14" aria-hidden="true">
            <motion.path
              d="M13 27.5 L22 36 L39 17"
              fill="none"
              stroke="white"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.12, duration: 0.42, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="absolute top-36 w-[min(88vw,22rem)] text-center"
        >
          <p className="font-display text-2xl font-extrabold text-sand-900">{message}</p>
          {sub && <p className="tnum mt-1 text-[0.95rem] font-bold text-sand-500">{sub}</p>}
        </motion.div>
      </div>
    </motion.div>,
    document.body,
  )
}
