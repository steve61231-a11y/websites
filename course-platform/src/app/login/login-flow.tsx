"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { ChevronLeft } from "@/components/icons";
import { Logo } from "@/components/nav";
import { photographyCourse } from "@/lib/catalog";
import { demo } from "@/lib/demo-store";

export function LoginFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const next = params.get("next") ?? "/dashboard";
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
    }, 700);
  }

  function update(filled: string[]) {
    setCode(filled);
    if (filled.every((c) => c !== "")) {
      setBusy(true);
      setTimeout(() => {
        demo.signIn(email.trim());
        router.push(next);
      }, 650);
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

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="wrap flex h-14 items-center">
        <Logo />
      </header>
      <main className="flex flex-1 items-start justify-center px-5 pt-[8vh] sm:items-center sm:pt-0">
        <div className="w-full max-w-[400px] pb-20">
          <AnimatePresence mode="wait">
            {stage === "email" ? (
              <motion.form
                key="email"
                onSubmit={sendCode}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="display text-[40px]">Welcome back.</h1>
                <p className="mt-2 text-[17px] text-muted">Use the email you enrolled with. We&apos;ll send you a sign-in code.</p>
                <input
                  className="input mt-8"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
                <button disabled={!valid || busy} className="btn btn-primary btn-lg mt-4 w-full">
                  {busy ? <Spinner /> : "Continue"}
                </button>
                <p className="mt-8 text-center text-[14px] text-muted">
                  Not enrolled yet? <Link href="/courses" className="link">Explore courses</Link>
                </p>
              </motion.form>
            ) : (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <button onClick={() => { setStage("email"); setCode(Array(6).fill("")); }} className="inline-flex items-center gap-1 text-[14px] text-accent">
                  <ChevronLeft size={16} /> Change email
                </button>
                <h1 className="display mt-4 text-[40px]">Check your inbox.</h1>
                <p className="mt-2 text-[17px] text-muted">
                  Enter the 6-digit code sent to <span className="text-ink">{email}</span>.
                </p>
                <div className="mt-8 flex justify-between gap-2">
                  {code.map((c, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputs.current[i] = el; }}
                      value={c}
                      onChange={(e) => setDigit(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !c && i > 0) inputs.current[i - 1]?.focus();
                      }}
                      inputMode="numeric"
                      autoComplete={i === 0 ? "one-time-code" : "off"}
                      aria-label={`Digit ${i + 1}`}
                      autoFocus={i === 0}
                      disabled={busy}
                      className="h-16 w-full min-w-0 rounded-2xl border border-line bg-white text-center text-[28px] font-semibold outline-none transition focus:border-accent focus:shadow-[0_0_0_4px_rgba(0,113,227,0.15)]"
                    />
                  ))}
                </div>
                <p className="mt-6 h-5 text-center text-[14px] text-muted">{busy ? "Signing you in…" : "Demo: any six digits will work."}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-14 border-t border-line pt-6 text-center">
            <button
              onClick={() => {
                demo.signInAsSample(photographyCourse.id);
                router.push("/dashboard");
              }}
              className="text-[13px] text-muted hover:text-ink"
            >
              Demo shortcut: continue as an enrolled student ›
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Spinner() {
  return <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}
