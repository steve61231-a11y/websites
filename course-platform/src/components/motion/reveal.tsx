"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Headline that rises into place word by word, each word masked by its own line. */
export function TextReveal({
  text,
  as = "h2",
  className,
  delay = 0,
  stagger = 0.035,
  inView = true,
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
  stagger?: number;
  inView?: boolean;
}) {
  const reduce = useReducedMotion();
  const Tag = as;
  const words = text.split(" ");
  const target = { y: "0%", rotate: 0 };
  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-top" style={{ marginRight: i < words.length - 1 ? "0.24em" : 0 }}>
          <motion.span
            className="inline-block will-change-transform"
            initial={reduce ? false : { y: "105%", rotate: 2 }}
            {...(inView ? { whileInView: target, viewport: { once: true, margin: "-10% 0px" } } : { animate: target })}
            transition={{ duration: 0.75, ease: EASE, delay: delay + i * stagger }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Content that eases in from slightly below, once. (No blur filter: it is costly on phones.) */
export function FadeIn({
  children,
  delay = 0,
  y = 16,
  className,
  inView = true,
  ...rest
}: { children: ReactNode; delay?: number; y?: number; inView?: boolean } & HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  const target = { opacity: 1, y: 0 };
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      {...(inView ? { whileInView: target, viewport: { once: true, margin: "-8% 0px" } } : { animate: target })}
      transition={{ duration: 0.7, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
