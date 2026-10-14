"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { useEffect, useRef } from "react";
import { joinList, navLinks } from "@/content/site";
import { cn } from "@/lib/cn";
import { formatLocalPhone, telHref } from "@/lib/phone";
import { buttonClass } from "@/components/ui/Button";
import { WhatsAppIcon } from "./icons";

const links = [...navLinks, { href: "/contact", label: "Contact" }] as const;

/**
 * Full-screen dark sheet under 1024px (PRD 3). Traps focus, closes on
 * Escape, on link tap and on the X, and locks page scroll while open.
 */
export function MobileMenu({
  open,
  onClose,
  phones,
  whatsappHref,
  counties,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  phones: string[];
  whatsappHref: string;
  counties: string[];
  pathname: string;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!open) {
      delete root.dataset.menuOpen;
      return;
    }
    root.dataset.menuOpen = "";
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const opener = document.activeElement as HTMLElement | null;
    const sheet = sheetRef.current;
    sheet?.querySelector<HTMLElement>("a, button")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !sheet) return;
      // The menu button in the header stays reachable so the X can close it.
      const toggle = document.querySelector<HTMLElement>('[aria-controls="mobile-menu"]');
      const focusables = [
        ...(toggle ? [toggle] : []),
        ...sheet.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      ];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = previousOverflow;
      delete root.dataset.menuOpen;
      opener?.focus?.();
    };
  }, [open, onClose]);

  const primaryPhone = phones[0];

  return (
    <div
      id="mobile-menu"
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      data-theme="dark"
      hidden={!open}
      className={cn(
        "fixed inset-0 z-40 overflow-y-auto pt-(--header-h) lg:hidden",
        open && "animate-[kk-fade_var(--dur-medium)_var(--ease-emphasis)_both]",
      )}
    >
      <div className="container-site flex min-h-full flex-col pb-[max(24px,env(safe-area-inset-bottom))]">
        <nav aria-label="Menu" className="pt-8">
          <ul className="flex flex-col gap-1">
            {links.map((link, i) => (
              <li
                key={link.href}
                className="rise-in"
                style={{ ["--i" as string]: i } as React.CSSProperties}
              >
                <Link
                  href={link.href}
                  data-cta="nav-links"
                  onClick={onClose}
                  aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "page" : undefined}
                  className="flex min-h-14 items-center text-[32px] font-semibold tracking-[-0.02em] aria-[current=page]:text-green-500"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-10 flex flex-col gap-3">
          {primaryPhone && (
            <a href={telHref(primaryPhone)} data-cta="menu-call" className={buttonClass("secondary", "md", "w-full")}>
              <Phone aria-hidden="true" size={20} strokeWidth={1.5} />
              Call {formatLocalPhone(primaryPhone)}
            </a>
          )}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            data-cta="menu-whatsapp"
            className={buttonClass("secondary", "md", "w-full")}
          >
            <WhatsAppIcon size={20} />
            WhatsApp us
          </a>
        </div>
        <p className="mt-auto pt-10 type-small text-fg-2">Serving {joinList(counties)}.</p>
      </div>
    </div>
  );
}
