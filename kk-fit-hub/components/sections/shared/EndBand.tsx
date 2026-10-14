import type { ReactNode } from "react";
import { SectionShell, type SectionTheme } from "@/components/site/SectionShell";

/** Conversion band that ends every inner page, so there is no dead end (PRD 7). */
export function EndBand({
  title,
  children,
  theme = "dark",
  glow = "schools",
}: {
  title: string;
  children: ReactNode;
  theme?: SectionTheme;
  glow?: "schools" | "coaches" | "none";
}) {
  const glowClass = glow === "schools" ? "bg-door-schools" : glow === "coaches" ? "bg-door-coaches" : "";
  return (
    <SectionShell theme={theme} className={`grain ${theme === "dark" ? glowClass : ""}`} aria-label={title}>
      <div className="container-site text-center">
        <h2 className="type-display-l mx-auto max-w-[18ch] text-balance">{title}</h2>
        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-6">
          {children}
        </div>
      </div>
    </SectionShell>
  );
}
