"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckDraw } from "@/components/celebrate";
import { Check, ChevronLeft, Lock } from "@/components/icons";
import { AuthShell } from "@/components/site/auth-shell";
import { course, courseStats, formatPrice } from "@/lib/catalog";
import { demo } from "@/lib/demo-store";

type Step = "details" | "pay" | "phone" | "verify";
const VERIFY = ["Payment received", "Verified with Paystack", "Access granted", "Access email sent"];
const EASE = [0.16, 1, 0.3, 1] as const;

export function EnrollFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [dir, setDir] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<"mpesa" | "card">("mpesa");
  const [phone, setPhone] = useState("0712 345 678");
  const [done, setDone] = useState(0);
  const price = formatPrice(course.price, course.currency);
  const stats = courseStats(course);
  const valid = name.trim().length > 1 && /^\S+@\S+\.\S+$/.test(email);

  const go = (s: Step, d = 1) => {
    setDir(d);
    setStep(s);
  };

  // M-Pesa: the STK push prompt, then the steps the webhook performs server-side.
  useEffect(() => {
    if (step === "phone") {
      const t = setTimeout(() => go("verify"), 2600);
      return () => clearTimeout(t);
    }
    if (step !== "verify") return;
    if (done >= VERIFY.length) {
      demo.purchase(course.id, email.trim(), name.trim());
      const t = setTimeout(() => router.push(`/welcome?email=${encodeURIComponent(email.trim())}`), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone((d) => d + 1), 800);
    return () => clearTimeout(t);
  }, [step, done, email, name, router]);

  return (
    <AuthShell
      image="/stills/day-1.jpg"
      caption={
        <div className="max-w-sm">
          <p className="eyebrow">What you get</p>
          <ul className="mt-4 space-y-2.5 text-[15px] text-ink-2">
            {[`${stats.lessons} videos over 7 days`, `${stats.quizzes} quizzes and a final assessment`, "WhatsApp community and support", "Verifiable certificate", "Lifetime access"].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <Check size={16} className="text-amber" /> {t}
              </li>
            ))}
          </ul>
        </div>
      }
    >
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          initial={{ opacity: 0, x: 24 * dir }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 * dir }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          {step === "details" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (valid) go("pay");
              }}
            >
              <p className="eyebrow">Step 1 of 2</p>
              <h1 className="headline mt-3 text-[38px] text-white">Almost there.</h1>
              <p className="mt-3 text-[16px] leading-relaxed text-muted">Your access is linked to this email, and your certificate uses this name.</p>
              <div className="mt-9 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[13px] font-medium text-ink-2">Full name</span>
                  <input id="name" className="field" autoComplete="name" placeholder="Amani Wanjiru" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[13px] font-medium text-ink-2">Email</span>
                  <input id="email" className="field" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
              </div>
              <button disabled={!valid} className="btn btn-white btn-lg mt-8 w-full">Continue to payment</button>
              <p className="mt-5 flex items-center justify-center gap-1.5 text-[12px] text-faint">
                <Lock size={13} /> Secured by Paystack
              </p>
            </form>
          )}

          {step === "pay" && (
            <div>
              <button onClick={() => go("details", -1)} className="inline-flex items-center gap-1 text-[14px] text-muted hover:text-white">
                <ChevronLeft size={16} /> Details
              </button>
              <p className="eyebrow mt-6">Step 2 of 2</p>
              <div className="mt-3 flex items-baseline justify-between gap-4">
                <h1 className="headline text-[38px] text-white">Pay</h1>
                <p className="font-[family-name:var(--font-display)] text-[26px] font-extrabold tracking-[-0.03em] text-white">{price}</p>
              </div>
              <p className="mt-1 text-[14px] text-muted">{course.shortTitle} · {course.title}</p>

              <div className="relative mt-8 grid grid-cols-2 rounded-2xl bg-white/[0.06] p-1 ring-1 ring-inset ring-white/10">
                {(["mpesa", "card"] as const).map((m) => (
                  <button key={m} onClick={() => setMethod(m)} className="relative z-10 rounded-xl py-3 text-[15px] font-semibold">
                    {method === m && (
                      <motion.span layoutId="pay-method" className="absolute inset-0 -z-10 rounded-xl bg-white" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                    )}
                    <span className={method === m ? "text-black" : "text-ink-2"}>{m === "mpesa" ? "M-Pesa" : "Card"}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4">
                {method === "mpesa" ? (
                  <label className="block">
                    <span className="mb-2 block text-[13px] font-medium text-ink-2">M-Pesa number</span>
                    <input id="phone" className="field tabular-nums" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </label>
                ) : (
                  <div className="space-y-3">
                    <input id="card" className="field tabular-nums" inputMode="numeric" defaultValue="4084 0840 8408 4081" aria-label="Card number" />
                    <div className="grid grid-cols-2 gap-3">
                      <input id="exp" className="field tabular-nums" defaultValue="12 / 28" aria-label="Expiry" />
                      <input id="cvc" className="field tabular-nums" defaultValue="408" aria-label="CVC" />
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => go(method === "mpesa" ? "phone" : "verify")} className="btn btn-amber btn-lg mt-8 w-full">
                Pay {price}
              </button>
              <p className="mt-4 text-center text-[12px] leading-relaxed text-faint">Demo: nothing is charged. In production this is Paystack&apos;s secure checkout.</p>
            </div>
          )}

          {step === "phone" && (
            <div className="py-6 text-center">
              <div className="relative mx-auto grid size-24 place-items-center">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute inset-0 rounded-full ring-2 ring-amber/60"
                    initial={{ scale: 0.6, opacity: 0.8 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
                  />
                ))}
                <svg width="34" height="52" viewBox="0 0 34 52" aria-hidden>
                  <rect x="1.5" y="1.5" width="31" height="49" rx="7" fill="none" stroke="white" strokeWidth="2.5" />
                  <rect x="12" y="44" width="10" height="2.5" rx="1.25" fill="white" />
                </svg>
              </div>
              <h1 className="headline mt-8 text-[30px] text-white">Check your phone.</h1>
              <p className="mx-auto mt-3 max-w-xs text-[16px] leading-relaxed text-muted">
                Enter your M-Pesa PIN on <span className="text-white">{phone}</span> to approve {price}.
              </p>
            </div>
          )}

          {step === "verify" && (
            <div className="py-4">
              <h1 className="headline text-[30px] text-white">Confirming your payment</h1>
              <p className="mt-2 text-[15px] text-muted">This takes a moment. Please keep this page open.</p>
              <ol className="mt-10 space-y-5">
                {VERIFY.map((label, i) => (
                  <li key={label} className="flex items-center gap-4 text-[16px]">
                    <span className="grid size-7 place-items-center">
                      {i < done ? (
                        <CheckDraw size={26} color="var(--amber)" />
                      ) : i === done ? (
                        <span className="size-5 animate-spin rounded-full border-2 border-white/15 border-t-amber" />
                      ) : (
                        <span className="size-2 rounded-full bg-white/20" />
                      )}
                    </span>
                    <span className={`transition-colors duration-500 ${i <= done ? "text-white" : "text-faint"}`}>{label}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </AuthShell>
  );
}
