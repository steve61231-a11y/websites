import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Button styles (PRD 10.7). Primary is always --green-600 with a white label;
 * coach is --orange-600. Secondary is transparent with a 1.5px border. */
export type ButtonVariant = "primary" | "coach" | "secondary";
export type ButtonSize = "lg" | "md" | "sm";

const base =
  "press inline-flex items-center justify-center gap-2 rounded-full text-center leading-tight font-semibold select-none sm:whitespace-nowrap " +
  "disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-green-600 text-white hover:bg-green-700 hover:shadow-[0_0_0_4px_rgb(58_166_85/0.3)] focus-visible:shadow-[0_0_0_4px_rgb(58_166_85/0.3)]",
  coach:
    "bg-orange-600 text-white hover:bg-orange-700 hover:shadow-[0_0_0_4px_rgb(228_87_46/0.3)] focus-visible:shadow-[0_0_0_4px_rgb(228_87_46/0.3)]",
  secondary:
    "border-[1.5px] border-current bg-transparent text-fg hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]",
};

const sizes: Record<ButtonSize, string> = {
  lg: "min-h-[52px] px-7 py-2 text-[17px]",
  md: "min-h-[52px] px-7 py-2 text-[17px]",
  sm: "min-h-11 px-5 py-1.5 text-[15px]",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string) {
  return cn(base, variants[variant], sizes[size], extra);
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Analytics id from the button map (PRD 4). */
  cta?: string;
  /** Magnetic pull on tier A (PRD 11.6). */
  magnetic?: boolean;
  children: ReactNode;
  className?: string;
};

function isExternal(href: string) {
  return /^(https?:|tel:|mailto:)/.test(href);
}

export function ButtonLink({
  href,
  variant,
  size,
  cta,
  magnetic,
  className,
  children,
  ...rest
}: CommonProps & Omit<ComponentProps<"a">, "href" | "className" | "children"> & { href: string }) {
  const props = {
    className: buttonClass(variant, size, className),
    "data-cta": cta,
    "data-magnetic": magnetic && (variant === "primary" || variant === "coach" || !variant) ? "" : undefined,
    ...rest,
  };
  if (isExternal(href)) {
    const external = href.startsWith("http");
    return (
      <a href={href} {...props} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}

export function Button({
  variant,
  size,
  cta,
  magnetic,
  className,
  children,
  type = "button",
  holdFocus,
  onMouseDown,
  ...rest
}: CommonProps &
  Omit<ComponentProps<"button">, "className" | "children"> & {
    /**
     * Keep focus where it is on press. Form buttons use this so the field
     * being left doesn't blur, show its error and shift the button before
     * the click lands. Defaults to true for submit buttons.
     */
    holdFocus?: boolean;
  }) {
  const hold = holdFocus ?? type === "submit";
  return (
    <button
      type={type}
      onMouseDown={(e) => {
        if (hold) e.preventDefault();
        onMouseDown?.(e);
      }}
      className={buttonClass(variant, size, className)}
      data-cta={cta}
      data-magnetic={magnetic ? "" : undefined}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Text link with → that nudges on hover (PRD 10.7). */
export function TextLink({
  href,
  cta,
  tone = "accent",
  className,
  children,
  ...rest
}: Omit<ComponentProps<"a">, "href"> & {
  href: string;
  cta?: string;
  tone?: "accent" | "fg" | "coach";
}) {
  const toneClass = tone === "fg" ? "text-fg" : tone === "coach" ? "text-coach-text" : "text-accent-text";
  const content = (
    <>
      {children} <span className="arrow" aria-hidden="true">→</span>
    </>
  );
  const cls = cn("text-link inline-flex min-h-11 items-center font-semibold", toneClass, className);
  if (isExternal(href)) {
    return (
      <a href={href} className={cls} data-cta={cta} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} data-cta={cta} {...rest}>
      {content}
    </Link>
  );
}
