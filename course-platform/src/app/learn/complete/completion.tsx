"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Confetti } from "@/components/celebrate";
import { Download, Mail, Share } from "@/components/icons";
import { CertificateImage, certificateFileName } from "@/components/learn/personal-certificate";
import { TextReveal } from "@/components/motion/reveal";
import { course } from "@/lib/catalog";
import { formatCertificateDate, useCertificateImage } from "@/lib/certificate-render";
import { demo, useDemo } from "@/lib/demo-store";
import { courseComplete } from "@/lib/progress";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Completion() {
  const state = useDemo();
  const eligible = courseComplete(state, course);
  const cert = state.certificates.find((c) => c.courseId === course.id);

  if (!eligible) {
    return (
      <div className="wrap flex min-h-dvh flex-col items-center justify-center text-center">
        <h1 className="headline text-[34px] text-white">Not quite yet.</h1>
        <p className="mt-3 max-w-sm text-[16px] text-muted">Finish every lesson and pass each quiz to receive your certificate.</p>
        <Link href="/learn" className="btn btn-white mt-8">Back to your path</Link>
      </div>
    );
  }

  const first = state.user?.name.split(" ")[0];
  return (
    <div className="relative overflow-hidden">
      <Confetti palette="amber" count={150} />
      <div aria-hidden className="absolute left-1/2 top-0 h-[80vh] w-[160vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_0%,rgba(194,106,18,0.4),transparent_60%)]" />
      <div className="wrap relative flex min-h-dvh flex-col items-center pb-20 pt-[12vh] text-center">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }} className="eyebrow">
          THE PROD · Complete
        </motion.p>
        <TextReveal as="h1" inView={false} delay={0.2} text={`You did it, ${first}.`} className="display mt-5 text-[clamp(44px,11vw,140px)] text-white" />
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }} className="mt-5 text-[clamp(17px,2.2vw,24px)] text-ink-2">
          Seven days. Every assessment passed.
        </motion.p>

        <AnimatePresence mode="wait">
          {cert ? <Issued key="issued" /> : <ConfirmName key="confirm" defaultName={state.user?.name ?? ""} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Before issuing: the student checks how their name will be printed, live on the certificate. */
function ConfirmName({ defaultName }: { defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [debounced, setDebounced] = useState(defaultName);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(name.trim() || " "), 220);
    return () => clearTimeout(t);
  }, [name]);
  const t = course.certificate;
  const image = useCertificateImage(t, { name: debounced, date: formatCertificateDate(t, new Date().toISOString()), number: `CERT-${new Date().getFullYear()}-${course.code}-······` });
  const valid = name.trim().length > 1;

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }} transition={{ duration: 0.7, ease: EASE, delay: 0.7 }} className="mt-12 w-full max-w-4xl">
      <CertificateImage template={t} url={image?.url} name={debounced} className="shadow-[0_50px_120px_-30px_rgba(245,165,36,0.3)]" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) demo.issueCertificate(course.id, course.code, name);
        }}
        className="mx-auto mt-8 max-w-md text-left"
      >
        <label htmlFor="cert-name" className="text-[14px] font-semibold text-white">Your name, exactly as it should appear</label>
        <input id="cert-name" value={name} onChange={(e) => setName(e.target.value)} className="field mt-2" autoComplete="name" maxLength={60} />
        <p className="mt-2 text-[13px] text-faint">Check the spelling. Your certificate can be verified by anyone, so it can&apos;t be changed after it&apos;s issued.</p>
        <button type="submit" disabled={!valid} className="btn btn-amber btn-lg mt-5 w-full">Issue my certificate</button>
      </form>
    </motion.div>
  );
}

/** After issuing: the certificate, a download, and the email it was sent in. */
function Issued() {
  const state = useDemo();
  const cert = state.certificates.find((c) => c.courseId === course.id)!;
  const t = course.certificate;
  const image = useCertificateImage(t, { name: cert.name, date: formatCertificateDate(t, cert.issuedAt), number: cert.number });

  return (
    <motion.div initial={{ opacity: 0, y: 60, rotateX: 30 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 0.9, ease: EASE }} style={{ transformPerspective: 1400 }} className="mt-12 w-full max-w-4xl">
      <CertificateImage template={t} url={image?.url} name={cert.name} className="shadow-[0_60px_140px_-30px_rgba(245,165,36,0.35)]" />
      <div className="mt-10 flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-3">
          {image ? (
            <a href={image.url} download={certificateFileName(cert.name)} className="btn btn-white btn-lg">
              <Download size={18} /> Download
            </a>
          ) : (
            <span className="btn btn-white btn-lg opacity-50"><Download size={18} /> Preparing…</span>
          )}
          <Link href={`/certificate/${cert.number}?print=1`} className="btn btn-glass btn-lg">PDF</Link>
          <Link href={`/certificate/${cert.number}`} className="btn btn-glass btn-lg">
            <Share size={18} /> Share
          </Link>
        </div>
        <p className="inline-flex items-center gap-2 text-[13px] text-faint">
          <Mail size={14} /> Emailed to {state.user?.email} with your certificate attached.
        </p>
        <Link href="/learn" className="mt-2 text-[14px] text-muted hover:text-white">Back to the course</Link>
      </div>
    </motion.div>
  );
}
