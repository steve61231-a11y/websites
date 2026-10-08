"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { course } from "@/lib/catalog";
import { useDemo } from "@/lib/demo-store";
import { courseProgress } from "@/lib/progress";

/** Top bar for the signed-in app: logo, optional context, progress and account. */
export function AppBar({ center }: { center?: ReactNode }) {
  const state = useDemo();
  const pct = Math.round(courseProgress(state, course) * 100);
  const initials = (state.user?.name ?? "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  const r = 9;
  const c = 2 * Math.PI * r;

  return (
    <header
      className="glass fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] pt-[env(safe-area-inset-top)]"
      style={{ viewTransitionName: "app-bar" }}
    >
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-4 px-4 sm:px-6">
        <Link href="/learn" aria-label="Course home" className="shrink-0 text-white">
          <Wordmark className="h-6 w-auto" />
        </Link>
        <div className="min-w-0 flex-1 truncate text-center text-[13px] text-muted">{center}</div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full bg-white/[0.06] py-1.5 pl-2 pr-3 text-[12px] font-semibold tabular-nums text-ink-2 ring-1 ring-inset ring-white/10 sm:flex">
            <svg width="22" height="22" viewBox="0 0 22 22" className="-rotate-90" aria-hidden>
              <circle cx="11" cy="11" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
              <circle cx="11" cy="11" r={r} fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} className="transition-[stroke-dashoffset] duration-1000" />
            </svg>
            {pct}%
          </span>
          <Link
            href="/account"
            aria-label="Account"
            className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-amber to-amber-deep text-[12px] font-bold text-black"
          >
            {initials || "·"}
          </Link>
        </div>
      </div>
    </header>
  );
}
