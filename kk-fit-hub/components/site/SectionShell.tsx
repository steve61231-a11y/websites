import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SectionTheme = "light" | "dark" | "tint";

/**
 * Every section declares its theme (PRD 10.8); the header reads it to switch
 * between light and dark glass.
 */
export function SectionShell({
  theme,
  children,
  className,
  pad = true,
  as: Tag = "section",
  ...rest
}: {
  theme: SectionTheme;
  children: ReactNode;
  className?: string;
  pad?: boolean;
  as?: "section" | "div" | "header" | "footer";
} & Omit<ComponentProps<"section">, "className" | "children" | "ref">) {
  return (
    <Tag data-theme={theme} className={cn(pad && "section-pad", "relative", className)} {...rest}>
      {children}
    </Tag>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("type-eyebrow mb-4", className)}>{children}</p>;
}
