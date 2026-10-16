"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CalModal } from "@/components/book/cal-modal";
import { Wordmark } from "@/components/brand/wordmark";
import { ReceiptPrinter, type ReceiptPrinterStage } from "@/components/receipt-printer";
import { ReceiptSlip } from "@/components/receipt-slip";
import { AuthShell } from "@/components/site/auth-shell";
import { brand } from "@/lib/catalog";
import type { Receipt } from "@/lib/receipt";

type Paid = { kind: "course" | "session"; item: string; name: string; email: string; notes: string; receipt: Receipt };
type Phase = "checking" | "paid" | "failed" | "late";

const STEPS = {
  course: ["Payment received", "Verifying with Paystack", "Granting your access", "Emailing your receipt"],
  session: ["Payment received", "Verifying with Paystack", "Reserving your session", "Emailing your receipt"],
};
const EASE = [0.16, 1, 0.3, 1] as const;

/** Where Paystack sends the student back to. Confirms the payment, then prints the receipt. */
export function ReturnFlow() {
  const reference = useSearchParams().get("reference") ?? "";
  const [phase, setPhase] = useState<Phase>(reference ? "checking" : "failed");
  const [paid, setPaid] = useState<Paid | null>(null);
  const [stage, setStage] = useState<ReceiptPrinterStage>("processing");
  const [done, setDone] = useState(0);
  const [calOpen, setCalOpen] = useState(false);
  const kind = paid?.kind ?? "course";

  // Ask the server until Paystack has confirmed (usually the first or second try).
  useEffect(() => {
    if (!reference) return;
    let stop = false;
    let tries = 0;
    const ask = async () => {
      tries += 1;
      try {
        const res = await fetch(`/api/pay/status?reference=${encodeURIComponent(reference)}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (stop) return;
        if (data.status === "success") {
          setPaid(data as Paid);
          setPhase("paid");
          return;
        }
        if (data.status === "failed" || data.status === "unknown") {
          setPhase("failed");
          return;
        }
      } catch {
        /* network blip: ask again */
      }
      if (tries >= 40) setPhase("late");
      else setTimeout(ask, 2500);
    };
    ask();
    return () => {
      stop = true;
    };
  }, [reference]);

  // Tick the checks, then print.
  useEffect(() => {
    if (phase !== "paid" || stage !== "processing") return;
    if (done < STEPS[kind].length - 1) {
      const t = setTimeout(() => setDone((d) => d + 1), 650);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStage("printing"), 500);
    return () => clearTimeout(t);
  }, [phase, stage, done, kind]);

  useEffect(() => {
    if (stage !== "printing") return;
    const t = setTimeout(() => setStage("complete"), 1900);
    return () => clearTimeout(t);
  }, [stage]);

  const topic = paid?.kind === "session" ? (brand.session.topics.find((t) => t.id === paid.item) ?? brand.session.topics[0]) : null;
  const cal = !!topic && brand.session.provider === "cal";

  useEffect(() => {
    if (!cal || stage !== "complete") return;
    const t = setTimeout(() => setCalOpen(true), 900);
    return () => clearTimeout(t);
  }, [cal, stage]);

  if (phase === "failed" || phase === "late") {
    return (
      <AuthShell image="/thumbs/the-prod/day-1.jpg" caption={null}>
        <div className="py-6">
          <Wordmark className="h-6 w-auto text-white" />
          <h1 className="headline mt-8 text-[30px] text-white">{phase === "late" ? "Still confirming…" : "The payment didn't go through."}</h1>
          <p className="mt-3 max-w-sm text-[16px] leading-relaxed text-muted">
            {phase === "late"
              ? "Paystack hasn't confirmed it yet. If money left your account, don't pay again: your access and receipt will arrive by email within a few minutes."
              : "Nothing was charged. You can try again, or use a different method."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {phase === "failed" && (
              <Link href="/enroll" className="btn btn-white btn-lg">
                Try again
              </Link>
            )}
            <a href={`mailto:${brand.email}`} className="btn btn-lg bg-white/10 text-white">
              Contact us
            </a>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell image={kind === "session" ? "/stills/duncan.jpg" : "/thumbs/the-prod/day-1.jpg"} caption={null}>
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
              <ReceiptPrinter.Status>{stage === "processing" ? (phase === "checking" ? "Confirming with Paystack" : STEPS[kind][done]) : undefined}</ReceiptPrinter.Status>
            </ReceiptPrinter.Screen>
          </ReceiptPrinter.Machine>
          <ReceiptPrinter.Output className="h-[27rem]">{paid ? <ReceiptSlip receipt={paid.receipt} /> : <ReceiptPrinter.Paper />}</ReceiptPrinter.Output>
        </ReceiptPrinter.Root>

        <AnimatePresence>
          {stage === "complete" && paid && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.15 }} className="-mt-4 w-full text-center">
              {paid.kind === "course" ? (
                <>
                  <h1 className="headline text-[26px] text-white">You&apos;re in.</h1>
                  <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">
                    Your receipt and access link are on their way to <span className="text-white">{paid.email}</span>.
                  </p>
                  <Link href={`/sign-in?email=${encodeURIComponent(paid.email)}&next=/learn`} className="btn btn-white btn-lg mt-6 w-full">
                    Sign in and start
                  </Link>
                </>
              ) : (
                <>
                  <h1 className="headline text-[26px] text-white">Paid. Now pick your time.</h1>
                  <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">
                    Choose a day and time on Duncan&apos;s calendar. Your receipt is on its way to <span className="text-white">{paid.email}</span>.
                  </p>
                  {cal && (
                    <button onClick={() => setCalOpen(true)} className="btn btn-white btn-lg mt-6 w-full">
                      Pick your time
                    </button>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {cal && topic && paid && (
        <CalModal open={calOpen} onClose={() => setCalOpen(false)} topic={topic} name={paid.name} email={paid.email} notes={paid.notes} receiptNumber={paid.receipt.number} />
      )}
    </AuthShell>
  );
}
