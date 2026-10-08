"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect } from "react";
import { Confetti } from "@/components/celebrate";
import { Download, Share } from "@/components/icons";
import { Certificate } from "@/components/learn/certificate";
import { TextReveal } from "@/components/motion/reveal";
import { course } from "@/lib/catalog";
import { demo, useDemo } from "@/lib/demo-store";
import { formatDate } from "@/lib/format";
import { courseComplete } from "@/lib/progress";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Completion() {
  const state = useDemo();
  const eligible = courseComplete(state, course);
  const cert = state.certificates.find((c) => c.courseId === course.id);

  // Eligibility is re-checked before issuing. In production a server function
  // verifies every lesson and assessment before writing the certificate.
  useEffect(() => {
    if (eligible && !cert) demo.issueCertificate(course.id, course.code);
  }, [eligible, cert]);

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
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="eyebrow">
          THE PROD · Complete
        </motion.p>
        <TextReveal as="h1" inView={false} delay={0.35} text={`You did it, ${first}.`} className="display mt-5 text-[clamp(52px,11vw,140px)] text-white" />
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }} className="mt-5 text-[clamp(18px,2.2vw,24px)] text-ink-2">
          Seven days. Every assessment passed. Your certificate is ready.
        </motion.p>

        {cert && (
          <motion.div
            initial={{ opacity: 0, y: 140, rotateX: 40 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1.5, ease: EASE, delay: 1.4 }}
            style={{ transformPerspective: 1400 }}
            className="mt-14 w-full max-w-4xl shadow-[0_60px_140px_-30px_rgba(245,165,36,0.35)]"
          >
            <Certificate name={cert.name} date={formatDate(cert.issuedAt)} number={cert.number} />
          </motion.div>
        )}

        {cert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }} className="mt-10 flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-3">
              <Link href={`/certificate/${cert.number}?print=1`} className="btn btn-white btn-lg">
                <Download size={18} /> Download PDF
              </Link>
              <Link href={`/certificate/${cert.number}`} className="btn btn-glass btn-lg">
                <Share size={18} /> Share
              </Link>
            </div>
            <p className="text-[13px] text-faint">A copy has been sent to {state.user?.email}.</p>
            <Link href="/learn" className="mt-2 text-[14px] text-muted hover:text-white">Back to the course</Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
