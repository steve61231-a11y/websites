"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckDraw } from "@/components/celebrate";
import { Check, ChevronLeft, Lock, Mail } from "@/components/icons";
import { LensArt } from "@/components/lens-art";
import { Logo } from "@/components/nav";
import { GradientBackdrop } from "@/components/ui/hero-geometric";
import { courseStats, formatDuration, formatPrice } from "@/lib/catalog";
import { demo } from "@/lib/demo-store";
import type { Course } from "@/lib/types";

type Stage = "details" | "pay" | "verifying" | "done";

const verifySteps = ["Payment received", "Verified with Paystack", "Access granted", "Access email sent"];

export function CheckoutFlow({ course }: { course: Course }) {
  const [stage, setStage] = useState<Stage>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<"mpesa" | "card">("mpesa");
  const [step, setStep] = useState(0);
  const stats = courseStats(course);
  const price = formatPrice(course.price, course.currency);

  // Walks through what the webhook does server-side, so the demo tells the story.
  useEffect(() => {
    if (stage !== "verifying") return;
    if (step >= verifySteps.length) {
      demo.purchase(course.id, email, name.trim());
      const t = setTimeout(() => setStage("done"), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 750);
    return () => clearTimeout(t);
  }, [stage, step, course.id, email, name]);

  const valid = name.trim().length > 1 && /^\S+@\S+\.\S+$/.test(email);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#f5f5f7]">
      <header className="wrap relative z-10 flex h-14 items-center justify-between">
        <Logo />
        <span className="flex items-center gap-1.5 text-[12px] text-muted">
          <Lock size={13} /> Secure checkout
        </span>
      </header>

      <AnimatePresence mode="wait">
        {stage === "done" ? (
          <Done key="done" course={course} email={email} name={name} />
        ) : (
          <motion.main
            key="form"
            exit={{ opacity: 0, y: -12 }}
            className="wrap grid gap-8 pb-20 pt-6 lg:grid-cols-[1fr_440px] lg:pt-12"
          >
            {/* Summary */}
            <section className="lg:order-2">
              <div className="card overflow-hidden">
                <div className="grid h-44 place-items-center bg-night">
                  <LensArt className="h-36" animate={false} />
                </div>
                <div className="p-6">
                  <p className="text-[19px] font-semibold tracking-[-0.02em]">{course.title}</p>
                  <p className="mt-1 text-[14px] text-muted">by {course.instructor.name}</p>
                  <ul className="mt-5 space-y-2.5 text-[14px] text-ink-2">
                    {[
                      `${stats.modules} modules, ${stats.lessons} lessons`,
                      `${formatDuration(stats.seconds)} of protected video`,
                      "Quizzes after every module",
                      "Verifiable certificate",
                      "Lifetime access",
                    ].map((t) => (
                      <li key={t} className="flex items-center gap-2.5">
                        <Check size={16} className="text-success" /> {t}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-baseline justify-between border-t border-line pt-5">
                    <span className="text-[15px] text-muted">Total</span>
                    <span className="text-[24px] font-semibold tracking-tight">{price}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Form */}
            <section className="lg:order-1 lg:pr-8">
              <Link href={`/courses/${course.slug}`} className="inline-flex items-center gap-1 text-[14px] text-accent">
                <ChevronLeft size={16} /> Back
              </Link>
              <h1 className="display mt-4 text-[clamp(32px,5vw,48px)]">Almost there.</h1>
              <p className="mt-2 text-[17px] text-muted">Your access will be linked to the email you use here.</p>

              <form
                className="mt-10 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (valid) setStage("pay");
                }}
              >
                <Field label="Full name" hint="As it should appear on your certificate.">
                  <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="input" placeholder="Amani Wanjiru" />
                </Field>
                <Field label="Email">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    className="input"
                    placeholder="you@example.com"
                  />
                </Field>
                <button disabled={!valid} className="btn btn-primary btn-lg mt-4 w-full">
                  Continue to payment
                </button>
                <p className="text-center text-[12px] text-faint">Payments are processed securely by Paystack.</p>
              </form>
            </section>
          </motion.main>
        )}
      </AnimatePresence>

      {/* Payment sheet */}
      <AnimatePresence>
        {(stage === "pay" || stage === "verifying") && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => stage === "pay" && setStage("details")} />
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-[420px] rounded-t-[28px] bg-white p-6 pb-[max(24px,env(safe-area-inset-bottom))] sm:rounded-[28px] sm:p-8"
            >
              {stage === "pay" ? (
                <>
                  <p className="text-center text-[12px] font-medium uppercase tracking-[0.12em] text-faint">Demo payment</p>
                  <p className="mt-3 text-center text-[34px] font-semibold tracking-tight">{price}</p>
                  <p className="text-center text-[14px] text-muted">{email}</p>
                  <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-fill p-1">
                    {(["mpesa", "card"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMethod(m)}
                        className={`rounded-xl py-2.5 text-[14px] font-medium transition ${method === m ? "bg-white shadow-sm" : "text-muted"}`}
                      >
                        {m === "mpesa" ? "M-Pesa" : "Card"}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4">
                    {method === "mpesa" ? (
                      <input className="input" inputMode="tel" placeholder="07XX XXX XXX" defaultValue="0712 345 678" />
                    ) : (
                      <input className="input" inputMode="numeric" placeholder="Card number" defaultValue="4084 0840 8408 4081" />
                    )}
                  </div>
                  <button onClick={() => { setStep(0); setStage("verifying"); }} className="btn btn-dark btn-lg mt-5 w-full">
                    Pay {price}
                  </button>
                  <p className="mt-4 text-center text-[12px] leading-relaxed text-faint">
                    In production this is Paystack&apos;s secure checkout. Nothing is charged in the demo.
                  </p>
                </>
              ) : (
                <div className="py-2">
                  <p className="text-center text-[19px] font-semibold">Confirming your payment</p>
                  <p className="mt-1 text-center text-[14px] text-muted">This only takes a moment.</p>
                  <ol className="mt-7 space-y-4">
                    {verifySteps.map((label, i) => (
                      <li key={label} className="flex items-center gap-3 text-[15px]">
                        <span className="grid size-6 place-items-center">
                          {i < step ? (
                            <CheckDraw size={22} />
                          ) : i === step ? (
                            <span className="size-4 animate-spin rounded-full border-2 border-line border-t-accent" />
                          ) : (
                            <span className="size-2 rounded-full bg-line" />
                          )}
                        </span>
                        <span className={i <= step ? "text-ink" : "text-faint"}>{label}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12px] text-faint">{hint}</span>}
    </label>
  );
}

function Done({ course, email, name }: { course: Course; email: string; name: string }) {
  const router = useRouter();
  const first = name.trim().split(" ")[0];
  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="wrap flex flex-col items-center pb-24 pt-10 text-center sm:pt-16"
    >
      {/* Celebration backdrop, fading into the page */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] [mask-image:linear-gradient(to_bottom,black_45%,transparent)] sm:h-[520px]">
        <GradientBackdrop speed={1.4} />
      </div>
      <div className="relative z-10 flex flex-col items-center">
      <CheckDraw size={72} />
      <h1 className="display mt-6 text-[clamp(36px,6vw,56px)]">You&apos;re in, {first}.</h1>
      <p className="mt-3 max-w-md text-[17px] leading-relaxed text-ink-2">
        We&apos;ve sent your access link to <span className="text-ink">{email}</span>. Here&apos;s what it looks like.
      </p>
      </div>

      {/* Email preview */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="card relative z-10 mt-10 w-full max-w-md overflow-hidden text-left"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
          <span className="grid size-9 place-items-center rounded-full bg-ink text-white">
            <Mail size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold">Lumen</p>
            <p className="truncate text-[12px] text-muted">Your course access is ready</p>
          </div>
          <span className="text-[12px] text-faint">now</span>
        </div>
        <div className="px-7 py-8">
          <p className="text-[22px] font-semibold tracking-[-0.02em]">Your course access is ready.</p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
            Hi {first}, thanks for enrolling in <strong>{course.title}</strong>. Your payment was verified and your access is active.
          </p>
          <button
            onClick={() => router.push(`/login?email=${encodeURIComponent(email)}&next=/learn/${course.slug}`)}
            className="btn btn-primary mt-6"
          >
            Begin learning
          </button>
          <p className="mt-6 text-[12px] text-faint">Receipt · {formatPrice(course.price, course.currency)} · Ref PSK_8F2K19X</p>
        </div>
      </motion.div>
    </motion.main>
  );
}
