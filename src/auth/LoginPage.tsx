import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { LogoMark, Wordmark } from '@/brand/Logo'
import { Button } from '@/components/ui/Button'
import { Field, TextInput } from '@/components/ui/fields'
import { useAuth } from './AuthProvider'

type Mode = 'password' | 'magic' | 'signup'

export function LoginPage() {
  const { signIn, signUp, sendMagicLink, isDemo, enterDemo } = useAuth()
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSent(null)
    setBusy(true)
    try {
      if (mode === 'password') {
        await signIn(email, password)
      } else if (mode === 'magic') {
        await sendMagicLink(email)
        setSent('Check your email — we sent you a link to sign in. It works for one hour.')
      } else {
        const { needsConfirmation } = await signUp(email, password, fullName)
        if (needsConfirmation) {
          setSent('Almost there — confirm your email address, then come back and sign in.')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <BlossomBackdrop />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="w-full max-w-[26rem]"
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <LogoMark className="h-20 w-20" animate />
            <Wordmark className="mt-5 w-[13.5rem]" />
            <p className="mt-4 text-[0.95rem] font-semibold text-sand-500">
              Everything the school runs on, in one place.
            </p>
          </div>

          <div className="card p-6 sm:p-7">
            {isDemo ? (
              <DemoEntry onEnter={enterDemo} />
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-5"
                  >
                    {mode === 'signup' && (
                      <Field label="Your name" htmlFor="name">
                        <TextInput
                          id="name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Grace Wanjiru"
                          autoComplete="name"
                          required
                        />
                      </Field>
                    )}

                    <Field label="Email address" htmlFor="email">
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sand-400" aria-hidden="true" />
                        <TextInput
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@irisfields.ac.ke"
                          autoComplete="email"
                          className="pl-12"
                          required
                        />
                      </div>
                    </Field>

                    {mode !== 'magic' && (
                      <Field
                        label="Password"
                        htmlFor="password"
                        hint={mode === 'signup' ? 'At least 8 characters' : undefined}
                      >
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sand-400" aria-hidden="true" />
                          <TextInput
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                            minLength={8}
                            className="pl-12"
                            required
                          />
                        </div>
                      </Field>
                    )}
                  </motion.div>
                </AnimatePresence>

                {error && (
                  <p role="alert" className="rounded-2xl bg-bad-soft px-4 py-3 text-sm font-bold text-bad-ink">
                    {error}
                  </p>
                )}
                {sent && (
                  <p className="rounded-2xl bg-good-soft px-4 py-3 text-sm font-bold text-good-ink">{sent}</p>
                )}

                <Button type="submit" size="lg" block loading={busy} trailingIcon={<ArrowRight className="h-5 w-5" />}>
                  {mode === 'password' ? 'Sign in' : mode === 'magic' ? 'Email me a link' : 'Create my account'}
                </Button>

                <div className="flex flex-col gap-2 border-t hairline pt-4 text-center text-sm font-bold">
                  {mode !== 'magic' && (
                    <button type="button" onClick={() => setMode('magic')} className="text-iris-600 hover:text-iris-700">
                      Sign in with an email link instead
                    </button>
                  )}
                  {mode !== 'password' && (
                    <button type="button" onClick={() => setMode('password')} className="text-iris-600 hover:text-iris-700">
                      Use my password
                    </button>
                  )}
                  {mode !== 'signup' && (
                    <button type="button" onClick={() => setMode('signup')} className="text-sand-500 hover:text-sand-700">
                      First time here? Create an account
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-xs font-semibold text-sand-400">
            Iris Fields School · Nairobi
          </p>
        </motion.div>
      </div>
    </div>
  )
}

function DemoEntry({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-blob bg-gold-100 text-gold-700">
        <Sparkles className="h-7 w-7" aria-hidden="true" />
      </div>
      <div>
        <h1 className="font-display text-xl font-extrabold text-sand-900">You're in demo mode</h1>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-sand-500">
          No database is connected yet, so the app is running on a sample school that lives only in
          this browser. Click around freely — nothing here is real, and nothing you do can break
          anything.
        </p>
      </div>
      <Button size="lg" block onClick={onEnter} trailingIcon={<ArrowRight className="h-5 w-5" />}>
        Open the demo
      </Button>
      <p className="text-xs font-semibold leading-relaxed text-sand-400">
        Add your Supabase keys to <code className="rounded bg-sand-100 px-1 py-0.5">.env.local</code> to
        switch on real accounts and the real database.
      </p>
    </div>
  )
}

/** Soft drifting petals — the brand, at rest. */
function BlossomBackdrop() {
  const petals = [
    { left: '6%', top: '12%', size: 130, color: '#665EC7', delay: 0 },
    { left: '78%', top: '8%', size: 92, color: '#00AEEF', delay: 0.6 },
    { left: '86%', top: '62%', size: 150, color: '#F1D058', delay: 1.1 },
    { left: '12%', top: '72%', size: 110, color: '#00AEEF', delay: 0.3 },
    { left: '46%', top: '88%', size: 80, color: '#665EC7', delay: 0.9 },
  ]
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-[42%_58%_52%_48%] opacity-[0.13] blur-[2px]"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size * 1.25, backgroundColor: p.color }}
          animate={{ y: [0, -16, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 9 + i, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
        />
      ))}
    </div>
  )
}
