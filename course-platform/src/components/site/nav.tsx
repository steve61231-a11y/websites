"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { useDemo } from "@/lib/demo-store";

const links = [
  { href: "/#course", label: "The course" },
  { href: "/#instructor", label: "Instructor" },
  { href: "/#pricing", label: "Pricing" },
];

export function SiteNav() {
  const { user, enrolled } = useDemo();
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setSolid(v > 24));

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  const signedIn = !!user && enrolled.length > 0;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-[max(12px,env(safe-area-inset-top))] sm:px-5" style={{ viewTransitionName: "site-nav" }}>
        <motion.nav
          className="mx-auto flex h-14 max-w-[1160px] items-center justify-between rounded-full pl-5 pr-2 transition-[background-color,box-shadow] duration-500"
          animate={{
            backgroundColor: solid || open ? "rgba(18,18,20,0.72)" : "rgba(18,18,20,0)",
            boxShadow: solid ? "inset 0 0 0 1px rgba(255,255,255,0.08), 0 20px 40px -20px rgba(0,0,0,0.8)" : "inset 0 0 0 1px rgba(255,255,255,0)",
          }}
          style={{ backdropFilter: solid || open ? "blur(24px) saturate(1.6)" : "none", WebkitBackdropFilter: solid || open ? "blur(24px) saturate(1.6)" : "none" }}
        >
          <Link href="/" aria-label="THE PROD home" className="text-white" onClick={() => setOpen(false)}>
            <Wordmark className="h-[26px] w-auto" />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-full px-4 py-2 text-[14px] font-medium text-ink-2 transition-colors hover:text-white">
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {signedIn ? (
              <Link href="/learn" className="btn btn-white min-h-10 px-5 text-[14px]">Continue learning</Link>
            ) : (
              <>
                <Link href="/sign-in" className="btn btn-ghost hidden min-h-10 px-4 text-[14px] sm:inline-flex">Sign in</Link>
                <Link href="/enroll" className="btn btn-white min-h-10 px-5 text-[14px]">Get access</Link>
              </>
            )}
            <button
              onClick={() => setOpen((o) => !o)}
              className="grid size-10 place-items-center rounded-full text-white md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <span className="relative block h-3 w-5">
                <motion.span className="absolute left-0 top-0 h-[1.5px] w-5 rounded bg-white" animate={open ? { rotate: 45, y: 5.25 } : { rotate: 0, y: 0 }} />
                <motion.span className="absolute bottom-0 left-0 h-[1.5px] w-5 rounded bg-white" animate={open ? { rotate: -45, y: -5.25 } : { rotate: 0, y: 0 }} />
              </span>
            </button>
          </div>
        </motion.nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/80 px-6 pt-28 backdrop-blur-2xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0.15 } }}
          >
            <ul className="space-y-2">
              {[...links, { href: "/sign-in", label: signedIn ? "My learning" : "Sign in" }].map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.05 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
                  exit={{ opacity: 0, y: -10, transition: { delay: (3 - i) * 0.03 } }}
                >
                  <Link href={signedIn && l.href === "/sign-in" ? "/learn" : l.href} onClick={() => setOpen(false)} className="block py-2 font-[family-name:var(--font-display)] text-[40px] font-extrabold uppercase tracking-[-0.03em] text-white">
                    {l.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
