"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, Lock } from "@/components/icons";
import { AuthShell } from "@/components/site/auth-shell";
import { brand, course, courseStats, formatPrice } from "@/lib/catalog";
import { demo } from "@/lib/demo-store";
import { Wordmark } from "@/components/brand/wordmark";
import { ReceiptPrinter, type ReceiptPrinterStage } from "@/components/receipt-printer";
import { demoReceipt, paidWith, receiptDate, type Receipt } from "@/lib/receipt";

type Step = "details" | "pay" | "phone" | "receipt";
// What the server does once Paystack reports the payment, shown on the printer screen.
const VERIFY = ["Payment received", "Verifying with Paystack", "Granting your access", "Emailing your receipt"];
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
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [stage, setStage] = useState<ReceiptPrinterStage>("processing");
  const price = formatPrice(course.price, course.currency);
  const stats = courseStats(course);
  const valid = name.trim().length > 1 && /^\S+@\S+\.\S+$/.test(email);

  const go = (s: Step, d = 1) => {
    setDir(d);
    setStep(s);
  };

  // M-Pesa: the STK push prompt. Then the printer: the server-side checks
  // tick by on its screen, and the receipt prints once access is granted.
  useEffect(() => {
    if (step === "phone") {
      const t = setTimeout(() => go("receipt"), 2600);
      return () => clearTimeout(t);
    }
    if (step !== "receipt" || stage !== "processing") return;
    if (done < VERIFY.length - 1) {
      const t = setTimeout(() => setDone((d) => d + 1), 750);
      return () => clearTimeout(t);
    }
    const r = demoReceipt(course, { name: name.trim(), email: email.trim(), method, contact: phone });
    const t = setTimeout(() => {
      demo.purchase(course.id, email.trim(), name.trim(), r);
      setReceipt(r);
      setStage("printing");
    }, 650);
    return () => clearTimeout(t);
  }, [step, stage, done, email, name, method, phone]);

  useEffect(() => {
    if (stage !== "printing") return;
    const t = setTimeout(() => setStage("complete"), 1900);
    return () => clearTimeout(t);
  }, [stage]);

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
          exit={{ opacity: 0, x: -16 * dir, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
          transition={{ duration: 0.4, ease: EASE }}
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

              <button onClick={() => go(method === "mpesa" ? "phone" : "receipt")} className="btn btn-amber btn-lg mt-8 w-full">
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

          {step === "receipt" && (
            <div className="flex flex-col items-center pb-2">
              <ReceiptPrinter.Root stage={stage} className="mx-auto">
                <ReceiptPrinter.Machine>
                  <ReceiptPrinter.Header>
                    <Wordmark className="mt-1 h-4 w-auto text-[#f2f2f2] opacity-80" />
                    <span
                      aria-hidden
                      className={`mt-1.5 size-2 rounded-full transition-colors duration-300 ${
                        stage === "complete" ? "bg-[#30d158] shadow-[0_0_10px_#30d158]" : "animate-pulse bg-amber shadow-[0_0_10px_var(--amber)]"
                      }`}
                    />
                  </ReceiptPrinter.Header>
                  <ReceiptPrinter.Screen>
                    <ReceiptPrinter.Status>{stage === "processing" ? VERIFY[done] : undefined}</ReceiptPrinter.Status>
                  </ReceiptPrinter.Screen>
                </ReceiptPrinter.Machine>
                <ReceiptPrinter.Output className="h-[27rem]">
                  {receipt ? <ReceiptSlip receipt={receipt} /> : <ReceiptPrinter.Paper />}
                </ReceiptPrinter.Output>
              </ReceiptPrinter.Root>

              <AnimatePresence>
                {stage === "complete" && receipt && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
                    className="-mt-4 w-full text-center"
                  >
                    <h1 className="headline text-[26px] text-white">You&apos;re in.</h1>
                    <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">
                      Your receipt and access link are on their way to <span className="text-white">{receipt.email}</span>.
                    </p>
                    <button
                      onClick={() => router.push(`/welcome?email=${encodeURIComponent(receipt.email)}`)}
                      className="btn btn-white btn-lg mt-6 w-full"
                    >
                      Continue
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </AuthShell>
  );
}

function Row({ k, v, strong = false }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-[13px] font-bold" : ""}`}>
      <span className={strong ? "" : "text-black/55"}>{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}

/** What prints on the paper. */
function ReceiptSlip({ receipt: r }: { receipt: Receipt }) {
  const total = formatPrice(r.amount, r.currency);
  return (
    <ReceiptPrinter.Paper className="text-[11px] leading-[1.7]">
      <div className="flex flex-col items-center text-center">
        <Wordmark className="h-7 w-auto text-[#161616]" />
        <p className="mt-2 uppercase tracking-[0.18em]">{brand.organisation}</p>
        <p className="text-black/55">productphotography.co.ke</p>
      </div>
      <div className="my-4 border-t border-dashed border-black/25" />
      <Row k="Receipt" v={r.number} />
      <Row k="Date" v={receiptDate(r)} />
      <div className="my-4 border-t border-dashed border-black/25" />
      <p className="font-bold">{r.courseTitle}</p>
      <div className="flex justify-between">
        <span className="text-black/55">1 × lifetime access</span>
        <span>{total}</span>
      </div>
      <div className="my-4 border-t border-dashed border-black/25" />
      <Row k="Total" v={total} strong />
      <Row k="Paid with" v={paidWith(r)} />
      <Row k="Ref" v={r.reference} />
      <div className="my-4 border-t border-dashed border-black/25" />
      <p className="text-center">Thank you, {r.name.split(" ")[0]}!</p>
      <svg viewBox="0 0 120 22" className="mx-auto mt-3 h-6 w-40" aria-hidden>
        {Array.from({ length: 46 }, (_, i) => {
          const w = [1, 2, 1, 3, 1, 2][(i * 7 + r.number.length) % 6];
          return <rect key={i} x={i * 2.6} y="0" width={w * 0.7} height="22" fill="#161616" />;
        })}
      </svg>
    </ReceiptPrinter.Paper>
  );
}
