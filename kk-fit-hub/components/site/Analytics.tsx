"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

const domain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;
/** Plausible by default; set NEXT_PUBLIC_ANALYTICS_SRC for a self-hosted Plausible or Umami script. */
const src = process.env.NEXT_PUBLIC_ANALYTICS_SRC ?? "https://plausible.io/js/script.tagged-events.js";

/**
 * Cookieless analytics (PRD 16.3): a small script plus one click listener
 * that reports every listed button (data-cta) and WhatsApp/call taps with
 * the page and position. Events carry no personal data. Never on /admin.
 */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!domain) return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("a, button");
      if (!el) return;
      const page = window.location.pathname;
      const cta = el.closest<HTMLElement>("[data-cta]")?.dataset.cta;
      const href = el.getAttribute("href") ?? "";
      if (cta) track("cta_click", { id: cta, page });
      if (href.startsWith("https://wa.me/")) track("whatsapp_click", { page, position: cta ?? "link" });
      else if (href.startsWith("tel:")) track("call_click", { page, position: cta ?? "link" });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  if (!domain || pathname.startsWith("/admin")) return null;
  return <Script defer data-domain={domain} src={src} strategy="afterInteractive" />;
}
