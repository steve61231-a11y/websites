import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Counts a number up on mount / when it changes. Used on the hero figures so the
 * big money numbers feel alive rather than just appearing.
 */
export function useCountUp(target: number, duration = 850): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))
  const fromRef = useRef(0)
  const frameRef = useRef<number>()

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target)
      return
    }
    const from = fromRef.current
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      // easeOutExpo — fast out of the gate, settles gently on the real figure.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      const next = from + (target - from) * eased
      setValue(next)
      fromRef.current = next
      if (t < 1) frameRef.current = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, duration])

  return value
}
