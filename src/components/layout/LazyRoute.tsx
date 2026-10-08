import {
  Component, Suspense, lazy, useState,
  type ComponentType, type ErrorInfo, type ReactNode,
} from 'react'
import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CardSkeleton } from '@/components/ui/primitives'

const RELOAD_FLAG = 'iris-fields:recovered-from-stale-chunk'

/**
 * Pages are loaded on demand, which keeps the first screen small but means a
 * page can fail to open for two ordinary reasons:
 *
 *   1. The app was redeployed while this tab was open. The HTML it is running
 *      points at script files that no longer exist, so the next section tapped
 *      asks for a 404 and simply never appears — until the user reloads, which
 *      is exactly what they end up doing.
 *   2. The connection dropped for a moment, which on a phone on mobile data is
 *      not rare.
 *
 * So: retry once after a beat for the blip, then reload the page once for the
 * stale deploy, then — only if it still fails — show something the user can act
 * on rather than a skeleton that never resolves.
 */
export function lazyPage<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory()
      sessionStorage.removeItem(RELOAD_FLAG)
      return mod
    } catch {
      // One retry, in case it was a momentary drop.
      await new Promise((resolve) => setTimeout(resolve, 600))
      try {
        const mod = await factory()
        sessionStorage.removeItem(RELOAD_FLAG)
        return mod
      } catch (err) {
        // Guarded so a genuinely offline phone cannot reload in a loop.
        if (!sessionStorage.getItem(RELOAD_FLAG)) {
          sessionStorage.setItem(RELOAD_FLAG, '1')
          window.location.reload()
          // Never resolves: the reload takes over before React renders anything.
          return new Promise<never>(() => {})
        }
        throw err
      }
    }
  })
}

type BoundaryState = { failed: boolean }

class PageErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false }

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('A page failed to open', error, info)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-blob bg-sand-100 text-3xl">
          📡
        </div>
        <h1 className="mt-4 font-display text-xl font-extrabold text-sand-900">
          That page didn't open
        </h1>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-sand-500">
          Usually the connection dropped for a second. Nothing has been lost — try again.
        </p>
        <Button
          className="mt-5"
          icon={<RotateCw className="h-4 w-4" />}
          onClick={() => {
            sessionStorage.removeItem(RELOAD_FLAG)
            window.location.reload()
          }}
        >
          Try again
        </Button>
      </div>
    )
  }
}

/** Suspense + a way out when the page genuinely cannot be fetched. */
export function LazyRoute({ children }: { children: ReactNode }) {
  // Remounting the boundary is what lets "Try again" work without a reload
  // when the retry above has already succeeded in the background.
  const [attempt] = useState(0)
  return (
    <PageErrorBoundary key={attempt}>
      <Suspense
        fallback={
          <div className="space-y-4">
            <CardSkeleton rows={2} />
            <CardSkeleton rows={4} />
          </div>
        }
      >
        {children}
      </Suspense>
    </PageErrorBoundary>
  )
}
