"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/Button";
import { WhatsAppIcon } from "./icons";

const hiddenOn = ["/request", "/join/apply", "/contact", "/admin"];

/**
 * Mobile action bar (PRD 3): appears once the first section has scrolled out
 * of view; hidden on form pages, while the menu is open and while the footer
 * is in view.
 */
export function ActionBar({ whatsappHref }: { whatsappHref: string }) {
  const pathname = usePathname();
  const [pastHero, setPastHero] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  const isHiddenRoute = hiddenOn.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isJoin = pathname === "/join" || pathname.startsWith("/join/");

  useEffect(() => {
    if (isHiddenRoute) return;
    const hero = document.querySelector("#main [data-theme]");
    const footer = document.querySelector("footer");
    const observers: IntersectionObserver[] = [];
    if (hero) {
      const io = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting), { threshold: 0 });
      io.observe(hero);
      observers.push(io);
    }
    if (footer) {
      const io = new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting), { threshold: 0 });
      io.observe(footer);
      observers.push(io);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, [pathname, isHiddenRoute]);

  if (isHiddenRoute) return null;
  const visible = pastHero && !footerVisible;

  return (
    <div
      data-theme="light"
      className={cn(
        "action-bar glass fixed inset-x-0 bottom-0 z-30 border-t border-hairline border-b-0! lg:hidden",
        "px-(--gutter) pt-3 pb-[max(12px,env(safe-area-inset-bottom))]",
        "transition-transform duration-(--dur-small) ease-(--ease-standard)",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
      aria-hidden={!visible}
      inert={!visible}
    >
      <div className="flex items-center gap-3">
        {isJoin ? (
          <ButtonLink href="/join/apply?source=bar" variant="coach" cta="bar-cta" className="flex-1">
            Apply to join
          </ButtonLink>
        ) : (
          <ButtonLink href="/request?source=bar" variant="primary" cta="bar-cta" className="flex-1">
            Request a demonstration
          </ButtonLink>
        )}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          data-cta="bar-whatsapp"
          aria-label="WhatsApp us"
          className="press grid size-12 shrink-0 place-items-center rounded-full border-[1.5px] border-current text-fg"
        >
          <WhatsAppIcon size={22} />
        </a>
      </div>
    </div>
  );
}
