"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CalModal } from "@/components/book/cal-modal";
import { BookedCard, fmtWhen, TimeStep, TopicStep } from "@/components/book/steps";
import { Check, ChevronLeft, Lock } from "@/components/icons";
import { AuthShell } from "@/components/site/auth-shell";
import { brand, course, courseStats, formatPrice } from "@/lib/catalog";
import { demo } from "@/lib/demo-store";
import { backendOn } from "@/lib/backend";
import { Wordmark } from "@/components/brand/wordmark";
import { ReceiptPrinter, type ReceiptPrinterStage } from "@/components/receipt-printer";
import { ReceiptSlip } from "@/components/receipt-slip";
import { courseItem, demoReceipt, paidWith, receiptDate, type Purchase, type Receipt } from "@/lib/receipt";
import type { SessionTopic } from "@/lib/types";

type Step = "topic" | "time" | "details" | "pay" | "phone" | "receipt";
// What the server does once Paystack reports the payment, shown on the printer screen.
const VERIFY = {
  course: ["Payment received", "Verifying with Paystack", "Granting your access", "Emailing your receipt"],
  session: ["Payment received", "Verifying with Paystack", "Reserving your session", "Emailing your receipt"],
};

const EASE = [0.16, 1, 0.3, 1] as const;

/** Checkout for the course (`/enroll`) or a paid 1:1 session (`/book`). */
export function EnrollFlow({ mode = "course" }: { mode?: "course" | "session" }) {
  const session = mode === "session";
  const cal = session && brand.session.provider === "cal"; // pay first, then Duncan's calendar pops up
  const total = cal ? 3 : 4;
  const [calOpen, setCalOpen] = useState(false);
  const verify = VERIFY[mode];
  const params = useSearchParams();
  const firstTopic = session ? (brand.session.topics.find((t) => t.id === params.get("topic")) ?? null) : null;
  const [topic, setTopic] = useState<SessionTopic | null>(firstTopic);
  const [slot, setSlot] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // The answers travel as one block of text: to Duncan's email, the booking and Cal.com's notes box.
  const notes = (topic?.questions ?? [])
    .filter((q) => answers[q.id]?.trim())
    .map((q) => `${q.label} ${answers[q.id].trim()}`)
    .join("\n");
  const item = useMemo<Purchase>(
    () =>
      session
        ? { id: "session", label: topic?.title ?? "1:1 session", ...(slot ? { detail: fmtWhen(slot) } : {}), price: topic?.price ?? brand.session.topics[0].price, currency: brand.session.currency }
        : courseItem(course),
    [session, topic, slot],
  );
  const router = useRouter();
  const [step, setStep] = useState<Step>(!session ? "details" : firstTopic ? (cal ? "details" : "time") : "topic");
  const [dir, setDir] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<"mpesa" | "card">("mpesa");
  const [phone, setPhone] = useState(session ? "" : "0712 345 678");
  const [done, setDone] = useState(0);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [stage, setStage] = useState<ReceiptPrinterStage>("processing");
  const price = formatPrice(item.price, item.currency);
  const stats = courseStats(course);
  const valid = name.trim().length > 1 && /^\S+@\S+\.\S+$/.test(email) && (!session || (phone.replace(/\D/g, "").length >= 9 && (topic?.questions ?? []).every((q) => !q.required || !!answers[q.id]?.trim())));

  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState("");

  // Real payments: the server prices it, Paystack takes the money, and the
  // student comes back to /pay/return where the receipt prints.
  const startPayment = async () => {
    setPayBusy(true);
    setPayError("");
    try {
      const res = await fetch("/api/pay/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: mode,
          item: session ? topic?.id : course.id,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          notes: notes.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "We couldn't start the payment. Please try again.");
      window.location.href = data.url;
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "We couldn't start the payment. Please try again.");
      setPayBusy(false);
    }
  };

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
    if (done < verify.length - 1) {
      const t = setTimeout(() => setDone((d) => d + 1), 750);
      return () => clearTimeout(t);
    }
    const r = demoReceipt(item, { name: name.trim(), email: email.trim(), method, contact: phone });
    const t = setTimeout(() => {
      if (mode === "course") demo.purchase(course.id, email.trim(), name.trim(), r);
      setReceipt(r);
      setStage("printing");
    }, 650);
    return () => clearTimeout(t);
  }, [step, stage, done, email, name, method, phone, mode, item, verify]);

  // Cal.com mode: the calendar pops up by itself once the receipt has printed.
  useEffect(() => {
    if (!cal || stage !== "complete") return;
    const t = setTimeout(() => setCalOpen(true), 900);
    return () => clearTimeout(t);
  }, [cal, stage]);

  useEffect(() => {
    if (stage !== "printing") return;
    const t = setTimeout(() => setStage("complete"), 1900);
    return () => clearTimeout(t);
  }, [stage]);

  return (
    <AuthShell
      image={session ? "/stills/duncan.jpg" : "/thumbs/the-prod/day-1.jpg"}
      caption={
        <div className="max-w-sm">
          <p className="eyebrow">What you get</p>
          <ul className="mt-4 space-y-2.5 text-[15px] text-ink-2">
            {(mode === "course"
              ? [`${stats.lessons} videos over 7 days`, `${stats.quizzes} quizzes and a final assessment`, "WhatsApp community and support", "Verifiable certificate", "Lifetime access"]
              : [`${brand.session.minutes} minutes, one on one with Duncan`, "Bring your products, your shots or your questions", "Pay, then pick a time that suits you", "Online, by video call"]
            ).map((t) => (
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
          {step === "topic" && (
            <TopicStep
              total={total}
              onPick={(t) => {
                setTopic(t);
                setAnswers({});
                go(cal ? "details" : "time");
              }}
            />
          )}

          {step === "time" && topic && (
            <TimeStep topic={topic} slot={slot} onPick={setSlot} onBack={() => go("topic", -1)} onContinue={() => slot && go("details")} />
          )}

          {step === "details" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (valid) go("pay");
              }}
            >
              {session && (
                <button type="button" onClick={() => go(cal ? "topic" : "time", -1)} className="mb-6 inline-flex items-center gap-1 text-[14px] text-muted hover:text-white">
                  <ChevronLeft size={16} /> {cal ? (topic?.title ?? "Topic") : slot ? fmtWhen(slot) : "Time"}
                </button>
              )}
              <p className="eyebrow">{session ? `Step ${cal ? 2 : 3} of ${total}` : "Step 1 of 2"}</p>
              <h1 className="headline mt-3 text-[38px] text-white">{session ? "Your details." : "Almost there."}</h1>
              <p className="mt-3 text-[16px] leading-relaxed text-muted">
                {session ? (cal ? "Your receipt goes to this email. After paying, you'll pick your time." : "We'll send your receipt and the calendar invite to this email.") : "Your access is linked to this email, and your certificate uses this name."}
              </p>
              <div className="mt-9 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[13px] font-medium text-ink-2">Full name</span>
                  <input id="name" className="field" autoComplete="name" placeholder="Amani Wanjiru" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[13px] font-medium text-ink-2">Email</span>
                  <input id="email" className="field" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                {session && (
                  <>
                    <label className="block">
                      <span className="mb-2 block text-[13px] font-medium text-ink-2">WhatsApp number</span>
                      <input id="whatsapp" className="field tabular-nums" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </label>
                    {topic?.questions.map((q) => (
                      <label key={q.id} className="block">
                        <span className="mb-2 block text-[13px] font-medium text-ink-2">
                          {q.label} {!q.required && <span className="text-faint">(optional)</span>}
                        </span>
                        <textarea
                          className="field min-h-20 resize-none py-3"
                          rows={2}
                          maxLength={400}
                          placeholder={q.placeholder}
                          value={answers[q.id] ?? ""}
                          onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                        />
                      </label>
                    ))}
                  </>
                )}
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
              <p className="eyebrow mt-6">{session ? `Step ${total} of ${total}` : "Step 2 of 2"}</p>
              <div className="mt-3 flex items-baseline justify-between gap-4">
                <h1 className="headline text-[38px] text-white">Pay</h1>
                <p className="font-[family-name:var(--font-display)] text-[26px] font-extrabold tracking-[-0.03em] text-white">{price}</p>
              </div>
              <p className="mt-1 text-[14px] text-muted">{item.label}</p>
              {item.detail && <p className="text-[14px] text-muted">{item.detail}</p>}

              {!backendOn && (
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
              )}

              {backendOn ? (
                <p className="mt-8 text-[14px] leading-relaxed text-muted">You&apos;ll pay on Paystack&apos;s secure page with M-Pesa or your card, then come straight back here.</p>
              ) : (
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
              )}

              {payError && <p role="alert" className="mt-4 text-[14px] text-red-400">{payError}</p>}
              <button
                disabled={payBusy}
                onClick={() => (backendOn ? startPayment() : go(method === "mpesa" ? "phone" : "receipt"))}
                className="btn btn-amber btn-lg mt-8 w-full"
              >
                {payBusy ? "Opening Paystack…" : `Pay ${price}`}
              </button>
              {!backendOn && <p className="mt-4 text-center text-[12px] leading-relaxed text-faint">Demo: nothing is charged. In production this is Paystack&apos;s secure checkout.</p>}
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
                    <ReceiptPrinter.Status>{stage === "processing" ? verify[done] : undefined}</ReceiptPrinter.Status>
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
                    {!session ? (
                      <>
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
                      </>
                    ) : (
                      cal ? (
                        <>
                          <h1 className="headline text-[26px] text-white">Paid. Now pick your time.</h1>
                          <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">
                            Choose a day and time on Duncan&apos;s calendar. Your receipt is on its way to <span className="text-white">{receipt.email}</span>.
                          </p>
                          <button onClick={() => setCalOpen(true)} className="btn btn-white btn-lg mt-6 w-full">
                            Pick your time
                          </button>
                        </>
                      ) : (
                        slot && <BookedCard topic={item.label} slot={slot} email={receipt.email} receiptNumber={receipt.number} />
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {cal && topic && receipt && (
        <CalModal open={calOpen} onClose={() => setCalOpen(false)} topic={topic} name={name.trim()} email={email.trim()} notes={notes} receiptNumber={receipt.number} />
      )}
    </AuthShell>
  );
}
