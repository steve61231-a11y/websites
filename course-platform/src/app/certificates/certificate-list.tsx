"use client";

import Link from "next/link";
import { Certificate } from "@/components/certificate";
import { Award } from "@/components/icons";
import { courses, getCourseById } from "@/lib/catalog";
import { useDemo } from "@/lib/demo-store";
import { formatDate } from "@/lib/format";
import { courseProgress } from "@/lib/progress";

export function CertificateList() {
  const state = useDemo();
  const mine = state.certificates;
  const inProgress = courses.find((c) => state.enrolled.includes(c.id));

  return (
    <div className="wrap pt-10 sm:pt-14">
      <h1 className="display text-[clamp(34px,5vw,48px)]">Certificates.</h1>
      {mine.length === 0 ? (
        <div className="card mt-10 flex flex-col items-center px-6 py-16 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-[#f6efe2] text-gold">
            <Award size={28} />
          </div>
          <h2 className="mt-6 text-[24px] font-semibold tracking-[-0.02em]">Complete a course to earn your first certificate.</h2>
          {inProgress && (
            <>
              <p className="mt-2 text-[17px] text-muted">
                You&apos;re {Math.round(courseProgress(state, inProgress) * 100)}% of the way through {inProgress.shortTitle}.
              </p>
              <Link href={`/learn/${inProgress.slug}`} className="btn btn-primary mt-8">Keep going</Link>
            </>
          )}
        </div>
      ) : (
        <ul className="mt-10 grid gap-8 sm:grid-cols-2">
          {mine.map((c) => {
            const course = getCourseById(c.courseId)!;
            return (
              <li key={c.number}>
                <Link href={`/certificates/${c.number}`} className="group block">
                  <div className="overflow-hidden rounded-[14px] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] transition-transform duration-500 group-hover:-translate-y-1">
                    <Certificate name={c.name} course={course.title} instructor={course.instructor.name} date={formatDate(c.issuedAt)} number={c.number} />
                  </div>
                  <p className="mt-4 text-[17px] font-semibold">{course.title}</p>
                  <p className="text-[14px] text-muted">Issued {formatDate(c.issuedAt)} · {c.number}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
