"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDemo } from "@/lib/demo-store";
import { Award, Home, User } from "./icons";

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${tone === "light" ? "text-white" : "text-ink"}`} aria-label="Lumen home">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 6.5 16.8 9.25v5.5L12 17.5l-4.8-2.75v-5.5Z" fill="currentColor" />
      </svg>
      <span className="text-[19px] font-semibold tracking-[-0.03em]">Lumen</span>
    </Link>
  );
}

export function SiteNav({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { user } = useDemo();
  const dark = tone === "dark";
  return (
    <header
      className={`sticky top-0 z-50 border-b ${
        dark ? "border-white/10 bg-black/70 backdrop-blur-xl" : "glass border-black/[0.06]"
      }`}
    >
      <nav className="wrap flex h-12 items-center justify-between">
        <Logo tone={dark ? "light" : "dark"} />
        <div className={`flex items-center gap-6 text-[13px] ${dark ? "text-white/80" : "text-ink-2"}`}>
          <Link href="/courses" className="hover:opacity-70">Courses</Link>
          <Link href="/#how" className="hidden hover:opacity-70 sm:block">How it works</Link>
          <Link href="/verify" className="hidden hover:opacity-70 sm:block">Verify</Link>
          {user ? (
            <Link href="/dashboard" className="rounded-full bg-accent px-3.5 py-1.5 font-medium text-white">
              My learning
            </Link>
          ) : (
            <Link href="/login" className="hover:opacity-70">Log in</Link>
          )}
        </div>
      </nav>
    </header>
  );
}

const tabs = [
  { href: "/dashboard", label: "Learn", icon: Home },
  { href: "/certificates", label: "Certificates", icon: Award },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppNav() {
  const path = usePathname();
  const { user } = useDemo();
  const initials = (user?.name ?? "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <>
      <header className="glass sticky top-0 z-50 border-b border-black/[0.06]">
        <nav className="wrap flex h-12 items-center justify-between">
          <Logo />
          <div className="hidden items-center gap-1 text-[13px] sm:flex">
            {tabs.slice(0, 2).map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-full px-3 py-1.5 transition-colors ${
                  path.startsWith(t.href) || (t.href === "/dashboard" && path.startsWith("/learn"))
                    ? "bg-fill text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                {t.label}
              </Link>
            ))}
            <Link
              href="/profile"
              aria-label="Profile"
              className="ml-2 grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#5e5ce6] to-accent text-[12px] font-semibold text-white"
            >
              {initials || <User size={16} />}
            </Link>
          </div>
        </nav>
      </header>

      {/* Mobile tab bar */}
      <nav
        className="glass fixed inset-x-0 bottom-0 z-50 border-t border-black/[0.06] pb-[env(safe-area-inset-bottom)] sm:hidden"
        aria-label="Primary"
      >
        <div className="grid grid-cols-3">
          {tabs.map(({ href, label, icon: I }) => {
            const active = path.startsWith(href) || (href === "/dashboard" && path.startsWith("/learn"));
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium ${active ? "text-accent" : "text-faint"}`}
              >
                <I size={24} strokeWidth={active ? 2 : 1.6} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="wrap flex flex-col gap-4 py-10 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/courses" className="hover:text-ink">Courses</Link>
          <Link href="/verify" className="hover:text-ink">Verify a certificate</Link>
          <Link href="/login" className="hover:text-ink">Log in</Link>
        </div>
        <p>© 2026 Lumen. Payments secured by Paystack.</p>
      </div>
    </footer>
  );
}
