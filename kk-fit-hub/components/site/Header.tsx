"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { navLinks } from "@/content/site";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/Button";
import { MobileMenu } from "./MobileMenu";
import { Wordmark } from "./Wordmark";

type Theme = "light" | "dark";

/** Routes whose first section is dark, so the header starts as dark glass
 * before scripts run. Scripts then follow the section underneath. */
const darkFirst = new Set(["/", "/programmes/kenpo-karate", "/join"]);

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header({
  phones,
  whatsappHref,
  counties,
}: {
  phones: string[];
  whatsappHref: string;
  counties: string[];
}) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>(darkFirst.has(pathname) ? "dark" : "light");
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const lastY = useRef(0);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const sync = useCallback(() => {
    const header = headerRef.current;
    if (!header) return;
    const probeY = header.offsetHeight / 2;
    // The section under the header decides the glass theme (PRD 3).
    const sections = document.querySelectorAll<HTMLElement>("#main [data-theme], footer[data-theme]");
    let next: Theme = "light";
    for (const el of sections) {
      const r = el.getBoundingClientRect();
      if (r.top <= probeY && r.bottom > probeY) {
        next = el.dataset.theme === "dark" ? "dark" : "light";
      }
    }
    setTheme(next);

    const y = window.scrollY;
    if (y > lastY.current && y > 600) setHidden(true);
    else if (y < lastY.current) setHidden(false);
    lastY.current = y;
  }, []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    };
    lastY.current = window.scrollY;
    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sync, pathname]);

  // Close the menu and show the header on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
    setHidden(false);
  }

  return (
    <>
      <header
        ref={headerRef}
        data-theme={menuOpen ? "dark" : theme}
        data-header-theme={menuOpen ? "dark" : theme}
        className={cn(
          "site-header glass fixed inset-x-0 top-0 z-50 h-(--header-h)",
          "transition-transform duration-(--dur-small) ease-(--ease-standard)",
          hidden && !menuOpen && "-translate-y-full",
        )}
      >
        <div className="container-site flex h-full items-center justify-between gap-6">
          <Wordmark />

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-8 text-[15px]">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    data-cta="nav-links"
                    aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
                    className="inline-flex min-h-11 items-center border-b-2 border-transparent text-fg/90 hover:text-fg aria-[current=page]:border-current aria-[current=page]:text-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3 lg:gap-6">
            <Link
              href="/contact"
              data-cta="nav-links"
              aria-current={isCurrent(pathname, "/contact") ? "page" : undefined}
              className="hidden min-h-11 items-center border-b-2 border-transparent text-[15px] text-fg/90 hover:text-fg aria-[current=page]:border-current lg:inline-flex"
            >
              Contact
            </Link>
            <ButtonLink href="/request?source=nav" size="sm" cta="nav-cta" className="min-h-10! px-4! py-0! text-[14px]! whitespace-nowrap lg:min-h-11!">
              <span className="lg:hidden">Request</span>
              <span className="hidden lg:inline">Request a demonstration</span>
            </ButtonLink>
            <button
              type="button"
              className="relative -mr-2 grid size-11 place-items-center lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span aria-hidden="true" className="relative block h-3 w-[22px]">
                <span
                  className={cn(
                    "absolute left-0 h-[1.5px] w-full rounded bg-current transition-transform duration-(--dur-medium) ease-(--ease-emphasis)",
                    menuOpen ? "top-[5px] rotate-45" : "top-0",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 h-[1.5px] w-full rounded bg-current transition-transform duration-(--dur-medium) ease-(--ease-emphasis)",
                    menuOpen ? "top-[5px] -rotate-45" : "top-[10px]",
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </header>
      <MobileMenu
        open={menuOpen}
        onClose={closeMenu}
        phones={phones}
        whatsappHref={whatsappHref}
        counties={counties}
        pathname={pathname}
      />
    </>
  );
}
