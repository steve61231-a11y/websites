"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Certificate } from "@/components/certificate";
import { Check, ChevronLeft, Download, Share, Shield } from "@/components/icons";
import { lookupCertificate } from "@/lib/certificates";
import { useDemo } from "@/lib/demo-store";
import { formatDate } from "@/lib/format";

export function CertificateView({ number }: { number: string }) {
  const state = useDemo();
  const found = state.ready ? lookupCertificate(number, state.certificates) : undefined;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (found && new URLSearchParams(window.location.search).get("print") === "1") {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [found]);

  if (!state.ready) return <div className="min-h-dvh bg-[#f5f5f7]" />;

  if (!found) {
    return (
      <div className="wrap flex min-h-dvh flex-col items-center justify-center text-center">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em]">We couldn&apos;t find that certificate.</h1>
        <p className="mt-2 text-[17px] text-muted">Check the ID and try again.</p>
        <Link href="/verify" className="btn btn-primary mt-8">Verify a certificate</Link>
      </div>
    );
  }

  const { cert, course } = found;
  const share = async () => {
    const url = `${window.location.origin}/certificates/${cert.number}`;
    if (navigator.share) {
      await navigator.share({ title: `${cert.name} · ${course.title}`, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-dvh bg-[#f5f5f7] print:bg-white">
      <header className="no-print wrap flex h-14 items-center justify-between">
        <Link href={state.user ? "/certificates" : "/"} className="inline-flex items-center gap-1 text-[14px] text-accent">
          <ChevronLeft size={16} /> {state.user ? "Certificates" : "Lumen"}
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-[12px] font-medium text-success">
          <Shield size={14} /> Verified
        </span>
      </header>
      <main className="wrap max-w-[1000px] pb-20 pt-4 print:m-0 print:max-w-none print:p-0">
        <div className="shadow-[0_40px_90px_-30px_rgba(0,0,0,0.3)] print:shadow-none">
          <Certificate name={cert.name} course={course.title} instructor={course.instructor.name} date={formatDate(cert.issuedAt)} number={cert.number} />
        </div>
        <div className="no-print mt-10 grid gap-8 sm:grid-cols-[1fr_auto] sm:items-start">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-[15px]">
            <div><dt className="text-[13px] text-muted">Awarded to</dt><dd className="font-medium">{cert.name}</dd></div>
            <div><dt className="text-[13px] text-muted">Issued</dt><dd className="font-medium">{formatDate(cert.issuedAt)}</dd></div>
            <div><dt className="text-[13px] text-muted">Course</dt><dd className="font-medium">{course.title}</dd></div>
            <div><dt className="text-[13px] text-muted">Certificate ID</dt><dd className="font-mono text-[14px]">{cert.number}</dd></div>
          </dl>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="btn btn-dark"><Download size={18} /> Download PDF</button>
            <button onClick={share} className="btn btn-quiet">
              {copied ? <><Check size={18} /> Link copied</> : <><Share size={18} /> Share</>}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
