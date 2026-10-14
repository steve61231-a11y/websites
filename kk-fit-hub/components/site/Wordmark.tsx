import Link from "next/link";
import { cn } from "@/lib/cn";

/** Wordmark until a logo exists (PRD 10.7): Inter 700, -0.03em, "KK" in
 * green-500 on dark or green-700 on light. */
export function Wordmark({ className, cta = "nav-logo" }: { className?: string; cta?: string }) {
  return (
    <Link
      href="/"
      data-cta={cta}
      className={cn("inline-flex min-h-11 items-center text-[20px] font-bold tracking-[-0.03em] text-fg", className)}
      aria-label="KK Fit Hub, home"
    >
      <span className="text-(--brand-kk)">KK</span>
      <span>&nbsp;Fit Hub</span>
    </Link>
  );
}
