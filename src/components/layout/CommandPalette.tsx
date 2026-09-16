import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Search, CornerDownLeft } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useParents, useStaff, useStudents } from '@/data/queries'
import { fullName } from '@/data/selectors'
import { NAV_ITEMS } from './nav'
import { useAuth } from '@/auth/AuthProvider'
import { Avatar } from '@/components/ui/primitives'

type Hit = {
  id: string
  title: string
  subtitle: string
  group: 'Students' | 'Parents' | 'Staff' | 'Go to'
  to: string
  emoji?: string
}

/**
 * Global search: jump to any student, parent or staff member — or any page —
 * from anywhere. Opens with the search button in the top bar, or Ctrl/⌘ + K.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)

  const { data: students = [] } = useStudents()
  const { data: parents = [] } = useParents()
  const { data: staff = [] } = useStaff()

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
    }
  }, [open])

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase()

    const people: Hit[] = [
      ...students.map((s) => ({
        id: `student-${s.id}`,
        title: fullName(s),
        subtitle: s.className ?? 'No class yet',
        group: 'Students' as const,
        to: `/students/${s.id}`,
      })),
      ...parents.map((p) => ({
        id: `parent-${p.id}`,
        title: p.fullName,
        subtitle: p.phone || 'Parent / guardian',
        group: 'Parents' as const,
        to: `/parents/${p.id}`,
      })),
      ...staff.map((m) => ({
        id: `staff-${m.id}`,
        title: m.fullName,
        subtitle: m.roleTitle || 'Staff',
        group: 'Staff' as const,
        to: `/staff?member=${m.id}`,
      })),
    ]

    const pages: Hit[] = NAV_ITEMS.filter((n) => can(n.capability)).map((n) => ({
      id: `nav-${n.to}`,
      title: n.label,
      subtitle: 'Page',
      group: 'Go to' as const,
      to: n.to,
      emoji: n.emoji,
    }))

    if (!q) return [...pages, ...people.slice(0, 6)]

    const score = (h: Hit) => {
      const t = h.title.toLowerCase()
      if (t.startsWith(q)) return 0
      if (t.includes(q)) return 1
      if (h.subtitle.toLowerCase().includes(q)) return 2
      return 99
    }
    return [...people, ...pages]
      .map((h) => ({ h, s: score(h) }))
      .filter(({ s }) => s < 99)
      .sort((a, b) => a.s - b.s || a.h.title.localeCompare(b.h.title))
      .slice(0, 12)
      .map(({ h }) => h)
  }, [query, students, parents, staff, can])

  useEffect(() => setCursor(0), [query])

  function go(hit: Hit | undefined) {
    if (!hit) return
    navigate(hit.to)
    onClose()
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[65] flex items-start justify-center px-4 pt-[12vh]">
          <motion.button
            aria-label="Close search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-sand-900/40 backdrop-blur-[3px]"
          />
          <motion.div
            role="dialog"
            aria-label="Search"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-lift"
          >
            <div className="flex items-center gap-3 border-b hairline px-5">
              <Search className="h-5 w-5 shrink-0 text-sand-400" aria-hidden="true" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setCursor((c) => Math.min(c + 1, hits.length - 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setCursor((c) => Math.max(c - 1, 0))
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    go(hits[cursor])
                  }
                }}
                placeholder="Search a child, a parent, a teacher…"
                aria-label="Search"
                className="h-16 w-full bg-transparent text-[1.05rem] font-semibold text-sand-900 placeholder:font-normal placeholder:text-sand-400 focus:outline-none"
              />
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2">
              {hits.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm font-semibold text-sand-400">
                  Nothing matches “{query}”.
                </p>
              ) : (
                hits.map((hit, i) => {
                  const showGroup = i === 0 || hits[i - 1].group !== hit.group
                  return (
                    <div key={hit.id}>
                      {showGroup && (
                        <p className="px-3 pb-1 pt-3 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-sand-400">
                          {hit.group}
                        </p>
                      )}
                      <button
                        onMouseEnter={() => setCursor(i)}
                        onClick={() => go(hit)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors',
                          i === cursor ? 'bg-iris-50' : 'hover:bg-sand-50',
                        )}
                      >
                        {hit.emoji ? (
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sand-100 text-lg">
                            {hit.emoji}
                          </span>
                        ) : (
                          <Avatar name={hit.title} size="sm" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-extrabold text-sand-900">{hit.title}</span>
                          <span className="block truncate text-sm text-sand-500">{hit.subtitle}</span>
                        </span>
                        {i === cursor && <CornerDownLeft className="h-4 w-4 shrink-0 text-iris-400" aria-hidden="true" />}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** Wires up ⌘K / Ctrl+K anywhere in the app. */
export function useCommandPalette() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return { open, setOpen }
}
