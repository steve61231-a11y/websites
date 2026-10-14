"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Arms the default fade-up reveals ([data-reveal]). Content is visible
 * without JavaScript; once this runs, elements below the fold are hidden
 * until they enter view. Elements already on screen stay visible.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
    );
    const arm = (el: Element) => {
      if (el.hasAttribute("data-revealed")) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.setAttribute("data-revealed", "");
      else io.observe(el);
    };
    document.querySelectorAll("[data-reveal]").forEach(arm);
    root.dataset.motion = "ready";
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
