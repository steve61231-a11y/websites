"use client";

import {
  Activity,
  Briefcase,
  ClipboardList,
  History,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquareQuote,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/actions/auth";
import { cn } from "@/lib/cn";

type Item = { href: string; label: string; icon: LucideIcon; owner?: boolean; badge?: number };

/** Left rail on desktop; bottom tab bar on mobile (PRD 15). */
export function AdminNav({
  isOwner,
  name,
  newRequests,
  toReview,
}: {
  isOwner: boolean;
  name: string;
  newRequests: number;
  toReview: number;
}) {
  const pathname = usePathname();
  const items: Item[] = [
    { href: "/admin", label: "Overview", icon: LayoutGrid },
    { href: "/admin/inquiries", label: "Requests", icon: ClipboardList, badge: newRequests },
    { href: "/admin/applications", label: "Coaches", icon: Users, badge: toReview },
    { href: "/admin/roles", label: "Roles", icon: Briefcase },
    { href: "/admin/activities", label: "Activities", icon: Activity, owner: true },
    { href: "/admin/content", label: "Content", icon: MessageSquareQuote, owner: true },
    { href: "/admin/settings", label: "Settings", icon: Settings, owner: true },
    { href: "/admin/team", label: "Team", icon: UserRound, owner: true },
    { href: "/admin/log", label: "Log", icon: History, owner: true },
  ].filter((i) => !i.owner || isOwner);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const tabs = items.slice(0, 3);
  const moreActive = !tabs.some((t) => active(t.href));

  return (
    <>
      {/* Desktop rail */}
      <nav aria-label="Admin" className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-hairline bg-paper px-4 py-6 lg:flex">
        <Link href="/admin" className="px-3 text-[20px] font-bold tracking-[-0.03em]">
          <span className="text-green-700">KK</span> Fit Hub
        </Link>
        <ul className="mt-8 flex flex-col gap-1">
          {items.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active(i.href) ? "page" : undefined}
                className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-text-2 hover:bg-canvas aria-[current=page]:bg-green-100 aria-[current=page]:text-green-700"
              >
                <i.icon aria-hidden="true" size={20} strokeWidth={1.5} />
                <span className="flex-1">{i.label}</span>
                {i.badge ? <Badge n={i.badge} /> : null}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto border-t border-hairline pt-4">
          <Link href="/admin/account" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] text-text-2 hover:bg-canvas">
            <UserRound aria-hidden="true" size={20} strokeWidth={1.5} />
            <span className="truncate">{name}</span>
          </Link>
          <form action={signOut}>
            <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] text-text-2 hover:bg-canvas">
              <LogOut aria-hidden="true" size={20} strokeWidth={1.5} />
              Sign out
            </button>
          </form>
        </div>
      </nav>

      {/* Mobile tabs */}
      <nav
        aria-label="Admin"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid grid-cols-4">
          {tabs.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active(i.href) ? "page" : undefined}
                className="relative flex min-h-16 flex-col items-center justify-center gap-1 text-[12px] font-medium text-text-2 aria-[current=page]:text-green-700"
              >
                <i.icon aria-hidden="true" size={22} strokeWidth={1.5} />
                {i.label}
                {i.badge ? (
                  <span className="absolute top-2 left-[calc(50%+6px)]">
                    <Badge n={i.badge} />
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/admin/more"
              aria-current={moreActive ? "page" : undefined}
              className="flex min-h-16 flex-col items-center justify-center gap-1 text-[12px] font-medium text-text-2 aria-[current=page]:text-green-700"
            >
              <Menu aria-hidden="true" size={22} strokeWidth={1.5} />
              More
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span className={cn("grid h-5 min-w-5 place-items-center rounded-full bg-orange-600 px-1.5 text-[12px] font-semibold text-white tabular")}>
      <span className="sr-only">(</span>
      {n > 99 ? "99+" : n}
      <span className="sr-only"> new)</span>
    </span>
  );
}
