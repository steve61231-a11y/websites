"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { Check, Download, Share, Shield } from "@/components/icons";
import { CertificateImage, certificateFileName } from "@/components/learn/personal-certificate";
import { formatCertificateDate, useCertificateImage } from "@/lib/certificate-render";
import { lookupCertificate } from "@/lib/certificates";
import { useDemo } from "@/lib/demo-store";
import { formatDate } from "@/lib/format";

export function CertificateView({ number }: { number: string }) {
  const state = useDemo();
  const found = state.ready ? lookupCertificate(number, state.certificates) : undefined;
  const [copied, setCopied] = useState(false);
  const image = useCertificateImage(
    found?.course.certificate,
    found ? { name: found.cert.name, date: formatCertificateDate(found.course.certificate, found.cert.issuedAt), number: found.cert.number } : null,
  );

  useEffect(() => {
    // ?print=1 opens the print dialog (Save as PDF) once the certificate is drawn.
    if (image && new URLSearchParams(window.location.search).get("print") === "1") {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [image]);

  if (!state.ready) return <div className="min-h-dvh bg-black" />;

  if (!found) {
    return (
      <div className="wrap flex min-h-dvh flex-col items-center justify-center text-center">
        <h1 className="headline text-[32px] text-white">We couldn&apos;t find that certificate.</h1>
        <p className="mt-3 text-[16px] text-muted">Check the ID and try again.</p>
        <Link href="/verify" className="btn btn-white mt-8">Verify a certificate</Link>
      </div>
    );
  }

  const { cert, course } = found;
  const share = async () => {
    const url = `${window.location.origin}/certificate/${cert.number}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked; the ID is shown on the page to copy by hand.
    }
  };

  return (
    <div className="min-h-dvh bg-black print:bg-white">
      <header className="no-print wrap flex h-20 items-center justify-between">
        <Link href={state.user ? "/learn" : "/"} className="text-white" aria-label="THE PROD">
          <Wordmark className="h-7 w-auto" />
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/15 px-3 py-1.5 text-[12px] font-semibold text-amber">
          <Shield size={14} /> Verified
        </span>
      </header>
      <main className="wrap max-w-[1080px] pb-20 print:m-0 print:max-w-none print:p-0">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="shadow-[0_50px_120px_-40px_rgba(245,165,36,0.3)] print:shadow-none">
          <CertificateImage template={course.certificate} url={image?.url} name={cert.name} />
        </motion.div>
        <div className="no-print mt-10 grid gap-8 sm:grid-cols-[1fr_auto] sm:items-start">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-5 text-[15px]">
            <div><dt className="text-[12px] text-muted">Awarded to</dt><dd className="mt-1 font-semibold text-white">{cert.name}</dd></div>
            <div><dt className="text-[12px] text-muted">Issued</dt><dd className="mt-1 font-semibold text-white">{formatDate(cert.issuedAt)}</dd></div>
            <div><dt className="text-[12px] text-muted">Course</dt><dd className="mt-1 font-semibold text-white">{course.shortTitle} · {course.title}</dd></div>
            <div><dt className="text-[12px] text-muted">Certificate ID</dt><dd className="mt-1 select-all font-mono text-[14px] text-white">{cert.number}</dd></div>
          </dl>
          <div className="flex gap-3">
            {image ? (
              <a href={image.url} download={certificateFileName(cert.name)} className="btn btn-white"><Download size={18} /> Download</a>
            ) : (
              <span className="btn btn-white opacity-50"><Download size={18} /> Preparing…</span>
            )}
            <button onClick={() => window.print()} className="btn btn-glass">PDF</button>
            <button onClick={share} className="btn btn-glass">{copied ? <><Check size={18} /> Link copied</> : <><Share size={18} /> Share</>}</button>
          </div>
        </div>
      </main>
    </div>
  );
}
