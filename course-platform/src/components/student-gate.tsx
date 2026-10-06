"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useDemo } from "@/lib/demo-store";
import { Lock } from "./icons";

// Client-side gate for the demo. In production the same checks run on the
// server (Supabase session + enrollment lookup) before any content is sent.

export function StudentGate({ courseId, children }: { courseId?: string; children: ReactNode }) {
  const { ready, user, enrolled } = useDemo();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [ready, user, router, path]);

  if (!ready || !user) return <Skeleton />;

  if (courseId && !enrolled.includes(courseId)) {
    return (
      <div className="wrap flex flex-col items-center py-32 text-center">
        <div className="grid size-16 place-items-center rounded-full bg-fill text-muted">
          <Lock size={26} />
        </div>
        <h1 className="mt-6 text-[28px] font-semibold tracking-[-0.02em]">You don&apos;t have access to this course.</h1>
        <p className="mt-2 max-w-sm text-[17px] text-muted">
          You&apos;re signed in as {user.email}. If you bought it with another email, sign in with that one instead.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/courses" className="btn btn-primary">See courses</Link>
          <Link href="/profile" className="btn btn-quiet">Switch account</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function Skeleton() {
  return (
    <div className="wrap animate-pulse py-16" aria-busy>
      <div className="h-10 w-64 rounded-xl bg-fill" />
      <div className="mt-10 h-72 rounded-[28px] bg-fill" />
      <div className="mt-6 h-20 rounded-2xl bg-fill" />
      <div className="mt-3 h-20 rounded-2xl bg-fill" />
    </div>
  );
}
