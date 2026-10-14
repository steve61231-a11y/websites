import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SectionShell, type SectionTheme } from "@/components/site/SectionShell";

/** Inner-page hero: H1, sub and actions, with room for the fixed header. */
export function PageHero({
  theme = "light",
  eyebrow,
  title,
  sub,
  children,
  aside,
  className,
}: {
  theme?: SectionTheme;
  eyebrow?: ReactNode;
  title: string;
  sub?: string;
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <SectionShell
      theme={theme}
      pad={false}
      className={cn(
        "pt-[calc(var(--header-h)+64px)] pb-20 lg:pt-[calc(var(--header-h)+112px)] lg:pb-28",
        theme === "dark" && "bg-stage-glow grain",
        className,
      )}
    >
      <div className={cn("container-site", Boolean(aside) && "grid gap-12 lg:grid-cols-12 lg:items-center")}>
        <div className={cn(aside ? "lg:col-span-6" : "max-w-[880px]")}>
          {eyebrow && <div className="rise-in mb-5">{eyebrow}</div>}
          <h1 className="type-display-xl rise-in-solid text-balance" style={{ "--i": 1 } as React.CSSProperties}>
            {title}
          </h1>
          {sub && (
            <p className="type-lead rise-in-solid measure mt-6 text-fg-2" style={{ "--i": 2 } as React.CSSProperties}>
              {sub}
            </p>
          )}
          {children && (
            <div
              className="rise-in mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4"
              style={{ "--i": 3 } as React.CSSProperties}
            >
              {children}
            </div>
          )}
        </div>
        {aside && <div className="settle-in lg:col-span-5 lg:col-start-8">{aside}</div>}
      </div>
    </SectionShell>
  );
}
