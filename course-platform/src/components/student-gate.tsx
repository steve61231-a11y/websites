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
    if (ready && !user) router.replace(`/sign-in?next=${encodeURIComponent(path)}`);
  }, [ready, user, router, path]);

  if (!ready || !user) return <Skeleton />;

  if (courseId && !enrolled.includes(courseId)) {
    return (
      <div className="wrap flex min-h-[80svh] flex-col items-center justify-center text-center">
        <div className="grid size-16 place-items-center rounded-full bg-white/[0.06] text-muted ring-1 ring-inset ring-white/10">
          <Lock size={24} />
        </div>
        <h1 className="headline mt-6 text-[30px] text-white">This course isn&apos;t on your account yet.</h1>
        <p className="mt-3 max-w-sm text-[16px] leading-relaxed text-muted">
          You&apos;re signed in as {user.email}. If you paid with a different email, sign in with that one.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/enroll" className="btn btn-white">Get access</Link>
          <Link href="/account" className="btn btn-glass">Switch account</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function Skeleton() {
  return (
    <div className="wrap animate-pulse pt-28" aria-busy>
      <div className="h-[46svh] rounded-[32px] bg-white/[0.04]" />
      <div className="mt-8 h-6 w-48 rounded-full bg-white/[0.05]" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-3xl bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}
