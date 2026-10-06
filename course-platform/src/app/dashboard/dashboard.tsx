"use client";

import Link from "next/link";
import { ComingSoonCard } from "@/components/course-cards";
import { CourseHome } from "@/components/course-home";
import { comingSoon, courses } from "@/lib/catalog";
import { useDemo } from "@/lib/demo-store";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function Dashboard() {
  const { user, enrolled } = useDemo();
  // Rendered only on the client (behind StudentGate), so local time is safe here.
  const hello = greeting();
  const mine = courses.filter((c) => enrolled.includes(c.id));
  const first = user?.name.split(" ")[0];

  return (
    <div className="wrap pt-10 sm:pt-14">
      <h1 className="display text-[clamp(34px,5vw,48px)]">
        {hello}, {first}.
      </h1>

      {mine.length === 0 ? (
        <div className="card mt-10 flex flex-col items-center px-6 py-16 text-center">
          <h2 className="text-[28px] font-semibold tracking-[-0.02em]">Your learning journey starts here.</h2>
          <p className="mt-2 max-w-sm text-[17px] text-muted">
            You haven&apos;t enrolled in a course yet. Bought one with a different email? Sign in with that address.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/courses" className="btn btn-primary">Explore courses</Link>
            <Link href="/profile" className="btn btn-quiet">Switch account</Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-16">
          {mine.map((c) => (
            <CourseHome key={c.id} course={c} />
          ))}
        </div>
      )}

      <div className="mt-20">
        <h3 className="text-[24px] font-semibold tracking-[-0.025em]">Coming to Lumen</h3>
        <p className="mt-1 text-[15px] text-muted">New courses from new instructors. You&apos;ll hear first.</p>
        <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-5">
          {comingSoon.map((c) => (
            <ComingSoonCard key={c.id} item={c} compact />
          ))}
        </div>
      </div>
    </div>
  );
}
