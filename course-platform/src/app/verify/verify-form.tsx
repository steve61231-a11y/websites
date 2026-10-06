"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { CheckDraw } from "@/components/celebrate";
import { lookupCertificate, sampleCertificate } from "@/lib/certificates";
import { useDemo } from "@/lib/demo-store";
import { formatDate } from "@/lib/format";

export function VerifyForm() {
  const { certificates } = useDemo();
  const [value, setValue] = useState("");
  const [result, setResult] = useState<ReturnType<typeof lookupCertificate> | null | undefined>(undefined);

  return (
    <div className="mt-10 w-full max-w-md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setResult(lookupCertificate(value, certificates) ?? null);
        }}
        className="flex gap-2"
      >
        <input
          className="input font-mono text-[15px] uppercase"
          placeholder="CERT-2026-PHOTO-000000"
          value={value}
          onChange={(e) => { setValue(e.target.value); setResult(undefined); }}
          aria-label="Certificate ID"
        />
        <button disabled={value.trim().length < 6} className="btn btn-primary min-h-[52px] shrink-0">Verify</button>
      </form>
      <button onClick={() => setValue(sampleCertificate.number)} className="mt-3 text-[13px] text-muted hover:text-ink">
        Try a sample: {sampleCertificate.number}
      </button>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div key="ok" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card mt-8 p-7 text-left">
            <div className="flex items-center gap-3">
              <CheckDraw size={36} />
              <p className="text-[19px] font-semibold">Valid certificate</p>
            </div>
            <dl className="mt-6 space-y-3 text-[15px]">
              <div className="flex justify-between gap-4"><dt className="text-muted">Awarded to</dt><dd className="font-medium">{result.cert.name}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Course</dt><dd className="text-right font-medium">{result.course.title}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Issued</dt><dd className="font-medium">{formatDate(result.cert.issuedAt)}</dd></div>
            </dl>
            <Link href={`/certificates/${result.cert.number}`} className="link mt-6 inline-block text-[15px]">View certificate ›</Link>
          </motion.div>
        )}
        {result === null && (
          <motion.p key="no" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-[15px] text-[#d13438]">
            No certificate matches that ID.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
