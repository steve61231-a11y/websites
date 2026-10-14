"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Close } from "@/components/icons";
import { calEmbedUrl } from "@/lib/booking/cal";
import { brand } from "@/lib/catalog";
import { useTheme } from "@/components/theme-toggle";
import type { SessionTopic } from "@/lib/types";
import { BookedCard, TimeStep } from "./steps";

/**
 * The calendar that pops up once payment is confirmed. With Duncan's Cal.com
 * link set (brand.session.calUrl) it shows his real calendar, with the
 * student's name and email filled in. Until then it shows a preview calendar
 * built from the weekly hours, so the whole journey can be walked through.
 */
export function CalModal({
  open,
  onClose,
  topic,
  name,
  email,
  notes,
  receiptNumber,
}: {
  open: boolean;
  onClose: () => void;
  topic: SessionTopic;
  name: string;
  email: string;
  notes: string;
  receiptNumber: string;
}) {
  const theme = useTheme();
  const src = calEmbedUrl({ url: brand.session.calUrl, name, email, topic: topic.title, notes, theme });
  const [slot, setSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-end bg-black/60 backdrop-blur-sm sm:place-items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18 } }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Pick your session time"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, transition: { duration: 0.18 } }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="relative flex h-[min(780px,94dvh)] w-full max-w-[920px] flex-col overflow-hidden rounded-t-[28px] bg-black ring-1 ring-white/10 sm:rounded-[28px]"
          >
            <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-white/[0.08] text-white backdrop-blur hover:bg-white/[0.16]">
              <Close size={18} />
            </button>
            {src ? (
              <iframe title="Pick your session time" src={src} className="h-full w-full flex-1 border-0" allow="payment" />
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-12">
                <div className="mx-auto w-full max-w-[420px]">
                  {booked && slot ? (
                    <div className="text-center">
                      <BookedCard topic={topic.title} slot={slot} email={email} receiptNumber={receiptNumber} />
                    </div>
                  ) : (
                    <>
                      <TimeStep topic={topic} slot={slot} onPick={setSlot} onBack={onClose} onContinue={() => setBooked(true)} eyebrow="Paid. Now pick your time." cta="Book" />
                      <p className="mt-6 text-center text-[12px] leading-relaxed text-faint">Preview calendar. With Duncan&apos;s Cal.com link connected, his real availability and Google Meet appear here.</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
