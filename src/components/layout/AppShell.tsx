import { useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, LogOut, MoreHorizontal, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import { LogoLockup, LogoMark } from '@/brand/Logo'
import { useAuth } from '@/auth/AuthProvider'
import { ROLE_LABEL } from '@/auth/permissions'
import { Avatar, Pill } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { NAV_ITEMS } from './nav'
import { CommandPalette, useCommandPalette } from './CommandPalette'

export function AppShell() {
  const { profile, can, signOut, isDemo } = useAuth()
  const palette = useCommandPalette()
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()

  const visible = NAV_ITEMS.filter((item) => can(item.capability))
  const primary = visible.filter((item) => item.primary)
  const secondary = visible.filter((item) => !item.primary)

  return (
    <div className="min-h-[100dvh] lg:flex">
      {/* ------------------------------------------------------ desktop rail */}
      <aside className="sticky top-0 hidden h-[100dvh] w-[17rem] shrink-0 flex-col border-r hairline bg-white/70 px-4 py-6 backdrop-blur-xl lg:flex">
        <LogoLockup className="px-2 pb-6" />

        <nav className="flex-1 space-y-1">
          {visible.map((item) => (
            <SideLink key={item.to} to={item.to} label={item.label} emoji={item.emoji} />
          ))}
        </nav>

        <div className="space-y-3 border-t hairline pt-4">
          {isDemo && <DemoBadge />}
          <div className="flex items-center gap-3 rounded-2xl bg-sand-50 p-3">
            <Avatar name={profile?.fullName ?? 'You'} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-sand-900">{profile?.fullName}</p>
              <p className="truncate text-xs font-bold text-sand-400">
                {profile ? ROLE_LABEL[profile.role] : ''}
              </p>
            </div>
            <button
              onClick={() => void signOut()}
              aria-label="Sign out"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sand-400 transition-colors hover:bg-white hover:text-bad-base"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------------- content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b hairline bg-sand-50/85 px-4 py-3 backdrop-blur-xl lg:px-8 lg:py-4">
          <LogoMark className="h-9 w-9 shrink-0 lg:hidden" />
          <div className="min-w-0 flex-1 lg:hidden">
            <p className="font-display text-base font-extrabold leading-none text-iris-700">Iris Fields</p>
            <p className="mt-0.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-sand-400">School</p>
          </div>

          <button
            onClick={() => palette.setOpen(true)}
            className={cn(
              'flex h-11 items-center gap-2.5 rounded-2xl bg-white px-3.5 text-sand-400 shadow-soft',
              'transition-colors hover:text-iris-600 lg:w-full lg:max-w-sm',
            )}
          >
            <Search className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="hidden text-sm font-semibold lg:inline">Search students, parents, staff…</span>
            <kbd className="ml-auto hidden rounded-lg bg-sand-100 px-2 py-1 text-[0.65rem] font-extrabold text-sand-500 lg:inline">
              ⌘K
            </kbd>
            <span className="sr-only lg:hidden">Search</span>
          </button>

          <div className="ml-auto hidden items-center gap-3 lg:flex">
            {isDemo && <DemoBadge compact />}
          </div>

          <Avatar name={profile?.fullName ?? 'You'} size="sm" className="lg:hidden" />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 lg:px-8 lg:pb-16 lg:pt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ------------------------------------------------------- phone tabs */}
      <nav
        aria-label="Main"
        className="safe-b fixed inset-x-0 bottom-0 z-30 flex border-t hairline bg-white/92 px-1.5 pt-1.5 backdrop-blur-xl lg:hidden"
      >
        {primary.map((item) => (
          <TabLink key={item.to} to={item.to} label={item.tab} emoji={item.emoji} />
        ))}
        {secondary.length > 0 && (
          <button
            onClick={() => setMoreOpen(true)}
            className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 pb-2 pt-1.5 text-sand-400"
          >
            <MoreHorizontal className="h-[22px] w-[22px]" aria-hidden="true" />
            <span className="truncate text-[0.66rem] font-extrabold">More</span>
          </button>
        )}
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More" size="sm">
        <div className="space-y-2 pb-4">
          {secondary.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              className="flex min-h-[60px] items-center gap-3.5 rounded-2xl bg-white px-4 shadow-soft"
            >
              <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-2xl bg-iris-50 text-xl">
                {item.emoji}
              </span>
              <span className="font-extrabold text-sand-800">{item.label}</span>
            </NavLink>
          ))}
          <Button
            variant="ghost"
            block
            className="mt-4"
            icon={<LogOut className="h-4 w-4" />}
            onClick={() => void signOut()}
          >
            Sign out
          </Button>
        </div>
      </Sheet>

      <CommandPalette open={palette.open} onClose={() => palette.setOpen(false)} />
    </div>
  )
}

function SideLink({ to, label, emoji }: { to: string; label: string; emoji: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'group relative flex min-h-[48px] items-center gap-3 rounded-2xl px-3 font-extrabold transition-colors duration-150',
          isActive ? 'bg-iris-500 text-white shadow-glow' : 'text-sand-600 hover:bg-white hover:text-iris-700',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={cn(
              'grid h-9 w-9 place-items-center rounded-xl text-lg transition-colors',
              isActive ? 'bg-white/20' : 'bg-sand-100 group-hover:bg-iris-50',
            )}
          >
            {emoji}
          </span>
          <span className="truncate text-[0.95rem]">{label}</span>
        </>
      )}
    </NavLink>
  )
}

function TabLink({ to, label, emoji }: { to: string; label: string; emoji: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 pb-2 pt-1.5 transition-colors',
          isActive ? 'text-iris-600' : 'text-sand-400',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="tab-pill"
              transition={{ type: 'spring', stiffness: 460, damping: 36 }}
              className="absolute inset-x-1.5 inset-y-0 -z-10 rounded-2xl bg-iris-50"
            />
          )}
          <span aria-hidden="true" className="text-[1.2rem] leading-none">{emoji}</span>
          <span className="truncate text-[0.66rem] font-extrabold">{label}</span>
        </>
      )}
    </NavLink>
  )
}

function DemoBadge({ compact }: { compact?: boolean }) {
  return (
    <Pill tone="gold" icon={<Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}>
      {compact ? 'Demo' : 'Demo data — not the real school'}
    </Pill>
  )
}

export function ShellFallback({ children }: { children: ReactNode }) {
  return <div className="grid min-h-[100dvh] place-items-center p-6">{children}</div>
}
