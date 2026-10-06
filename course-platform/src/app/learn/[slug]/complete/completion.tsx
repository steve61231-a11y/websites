"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect } from "react";
import { Confetti } from "@/components/celebrate";
import { Certificate } from "@/components/certificate";
import { Download, Share } from "@/components/icons";
import { demo, useDemo } from "@/lib/demo-store";
import { courseComplete } from "@/lib/progress";
import type { Course } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function Completion({ course }: { course: Course }) {
  const state = useDemo();
  const eligible = courseComplete(state, course);
  const cert = state.certificates.find((c) => c.courseId === course.id);

  // Eligibility is re-checked before issuing; in production this is a server
  // function that verifies every module and quiz before writing the row.
  useEffect(() => {
    if (eligible && !cert) demo.issueCertificate(course.id, course.code);
  }, [eligible, cert, course.id, course.code]);

  if (!eligible) {
    return (
      <div className="wrap flex min-h-dvh flex-col items-center justify-center text-center">
        <h1 className="text-[32px] font-semibold tracking-[-0.03em]">You&apos;re not there yet.</h1>
        <p className="mt-2 max-w-sm text-[17px] text-white/60">Complete every module and pass each quiz to receive your certificate.</p>
        <Link href={`/learn/${course.slug}`} className="btn btn-light mt-8">Back to your path</Link>
      </div>
    );
  }

  const first = state.user?.name.split(" ")[0];

  return (
    <div className="relative overflow-hidden">
      <Confetti palette="gold" count={140} />
      <div className="absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(ellipse_at_50%_0%,rgba(176,141,87,0.35),transparent_65%)]" />
      <div className="wrap relative flex min-h-dvh flex-col items-center pb-20 pt-[12vh] text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-[15px] font-medium text-[#d9bf8c]"
        >
          {course.title}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, scale: 0.94, filter: "blur(12px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
          className="display mt-3 text-[clamp(56px,12vw,128px)]"
        >
          You did it{first ? `, ${first}` : ""}.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-4 text-[clamp(19px,2.4vw,24px)] text-white/65"
        >
          Your certificate is ready.
        </motion.p>

        {cert && (
          <motion.div
            initial={{ opacity: 0, y: 120, rotateX: 35 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 1.5 }}
            style={{ transformPerspective: 1400 }}
            className="mt-14 w-full max-w-3xl shadow-[0_60px_120px_-30px_rgba(0,0,0,0.9)]"
          >
            <Certificate name={cert.name} course={course.title} instructor={course.instructor.name} date={formatDate(cert.issuedAt)} number={cert.number} />
          </motion.div>
        )}

        {cert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.4 }}
            className="mt-10 flex flex-col items-center gap-4"
          >
            <div className="flex flex-wrap justify-center gap-3">
              <Link href={`/certificates/${cert.number}?print=1`} className="btn btn-light btn-lg">
                <Download size={18} /> Download PDF
              </Link>
              <Link href={`/certificates/${cert.number}`} className="btn btn-lg bg-white/10 text-white hover:bg-white/15">
                <Share size={18} /> Share
              </Link>
            </div>
            <p className="text-[13px] text-white/45">A copy has been sent to {state.user?.email}.</p>
            <Link href="/dashboard" className="mt-4 text-[15px] text-[#2997ff] hover:underline">Back to Lumen ›</Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
