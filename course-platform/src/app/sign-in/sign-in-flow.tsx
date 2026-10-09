"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { ChevronLeft } from "@/components/icons";
import { AuthShell } from "@/components/site/auth-shell";
import { course } from "@/lib/catalog";
import { demo } from "@/lib/demo-store";

const EASE = [0.16, 1, 0.3, 1] as const;

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function SignInFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const next = params.get("next") ?? "/learn";
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [busy, setBusy] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const valid = /^\S+@\S+\.\S+$/.test(email);

  function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setStage("code");
    }, 650);
  }

  function update(filled: string[]) {
    setCode(filled);
    if (filled.every((c) => c !== "")) {
      setBusy(true);
      setTimeout(() => {
        demo.signIn(email.trim());
        router.push(next);
      }, 700);
    }
  }

  function setDigit(i: number, value: string) {
    const digits = value.replace(/\D/g, "");
    const filled = [...code];
    if (digits.length > 1) {
      digits.slice(0, 6 - i).split("").forEach((d, k) => (filled[i + k] = d));
      update(filled);
      inputs.current[Math.min(5, i + digits.length)]?.focus();
      return;
    }
    filled[i] = digits;
    update(filled);
    if (digits && i < 5) inputs.current[i + 1]?.focus();
  }

  function sample() {
    demo.signInAsSample(course.id);
    router.push(next);
  }

  return (
    <AuthShell
      image="/stills/welcome.jpg"
      caption={
        <p className="headline max-w-[16ch] text-[40px] text-white">Pick up exactly where you left off.</p>
      }
    >
      <AnimatePresence mode="wait">
        {stage === "email" ? (
          <motion.div key="email" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }} transition={{ duration: 0.38, ease: EASE }}>
            <h1 className="headline text-[40px] text-white">Sign in</h1>
            <p className="mt-2 text-[16px] text-muted">Use the email you paid with.</p>

            <button onClick={sample} className="btn btn-glass btn-lg mt-9 w-full">
              <GoogleMark /> Continue with Google
            </button>
            <div className="my-7 flex items-center gap-4 text-[12px] text-faint">
              <span className="h-px flex-1 bg-white/10" /> or with your email <span className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={sendCode}>
              <input
                id="email"
                className="field"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email"
              />
              <button disabled={!valid || busy} className="btn btn-white btn-lg mt-4 w-full">
                {busy ? <span className="size-5 animate-spin rounded-full border-2 border-black/20 border-t-black" /> : "Email me a code"}
              </button>
            </form>
            <p className="mt-8 text-center text-[14px] text-muted">
              New here?{" "}
              <Link href="/enroll" className="text-white underline-offset-4 hover:underline">
                Get access
              </Link>
            </p>
          </motion.div>
        ) : (
          <motion.div key="code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }} transition={{ duration: 0.38, ease: EASE }}>
            <button
              onClick={() => {
                setStage("email");
                setCode(Array(6).fill(""));
              }}
              className="inline-flex items-center gap-1 text-[14px] text-muted hover:text-white"
            >
              <ChevronLeft size={16} /> Change email
            </button>
            <h1 className="headline mt-5 text-[40px] text-white">Check your inbox.</h1>
            <p className="mt-2 text-[16px] leading-relaxed text-muted">
              We sent a 6-digit code to <span className="text-white">{email}</span>.
            </p>
            <div className="mt-9 grid grid-cols-6 gap-2">
              {code.map((c, i) => (
                <motion.input
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  value={c}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !c && i > 0) inputs.current[i - 1]?.focus();
                  }}
                  animate={busy ? { borderColor: "rgba(245,165,36,0.8)", scale: [1, 1.06, 1] } : {}}
                  transition={{ delay: i * 0.05 }}
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${i + 1}`}
                  autoFocus={i === 0}
                  disabled={busy}
                  className="h-16 w-full min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] text-center text-[28px] font-semibold text-white outline-none transition focus:border-amber focus:bg-white/[0.09]"
                />
              ))}
            </div>
            <p className="mt-6 h-5 text-center text-[14px] text-muted">{busy ? "Signing you in…" : "Demo: any six digits work."}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-12 border-t border-white/10 pt-6 text-center">
        <button onClick={sample} className="text-[13px] text-faint hover:text-white">
          Demo shortcut: continue as an enrolled student
        </button>
      </div>
    </AuthShell>
  );
}
