"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { WhatsAppIcon } from "./icons";

const formPages = ["/request", "/join/apply", "/contact", "/admin"];

/** Desktop WhatsApp button (PRD 3): 56px circle, bottom-right, after 400px of
 * scroll; hidden on form pages. */
export function WhatsAppFab({ whatsappHref }: { whatsappHref: string }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const hidden = formPages.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (hidden) return;
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hidden]);

  if (hidden) return null;

  return (
    <a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      data-cta="fab-whatsapp"
      aria-label="Chat on WhatsApp"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn(
        "group press fixed right-6 bottom-6 z-30 hidden size-14 place-items-center rounded-full bg-green-600 text-white shadow-float lg:grid",
        "transition-[opacity,transform] duration-(--dur-small) hover:bg-green-700",
        visible ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <WhatsAppIcon size={26} />
      <span
        role="tooltip"
        className="pointer-events-none absolute right-[calc(100%+12px)] rounded-full bg-ink-800 px-3 py-1.5 text-[14px] whitespace-nowrap text-canvas opacity-0 transition-opacity duration-(--dur-small) group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        Chat on WhatsApp
      </span>
    </a>
  );
}
