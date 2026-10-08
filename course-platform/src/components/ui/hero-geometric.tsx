"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "motion/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DITHER_FALLBACK_COLOR_1, DITHER_FALLBACK_COLOR_2, sanitizeHexColor } from "./dither-gradient";

// Brand blues for the dithered backdrop: Lumen accent into a pale sky.
export const LUMEN_DITHER = { color1: "#0071E3", color2: "#F2F7FF" };

const DitherGradient = dynamic(() => import("./dither-gradient"), { ssr: false });

/** The animated gradient on its own, filling its positioned parent. */
export function GradientBackdrop({
  color1 = LUMEN_DITHER.color1,
  color2 = LUMEN_DITHER.color2,
  speed = 1,
  className,
}: {
  color1?: string;
  color2?: string;
  speed?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const c1 = sanitizeHexColor(color1, DITHER_FALLBACK_COLOR_1);
  const c2 = sanitizeHexColor(color2, DITHER_FALLBACK_COLOR_2);
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 z-0", className)}
      // Shown until WebGL is ready, and kept when it isn't available.
      style={{ background: `linear-gradient(45deg, #ffffff 0%, ${c1} 18%, ${c2} 100%)` }}
    >
      <DitherGradient color1={c1} color2={c2} speed={reduce ? 0 : speed} />
    </div>
  );
}

interface HeroGeometricProps extends ComponentPropsWithoutRef<"div"> {
  title1?: string;
  title2?: string;
  description?: string;
  color1?: string;
  color2?: string;
  speed?: number;
  children?: ReactNode;
}

const HERO_HEADLINE_CLASS =
  "pb-[0.08em] text-[10.5cqi] md:text-[8cqi] lg:text-[6cqi] leading-[0.96] tracking-tighter font-bold text-ink";

export default function HeroGeometric({
  title1,
  title2,
  description,
  color1 = LUMEN_DITHER.color1,
  color2 = LUMEN_DITHER.color2,
  speed = 1,
  className,
  style,
  children,
  ...props
}: HeroGeometricProps) {
  return (
    <div
      className={cn("relative flex min-h-screen w-full flex-col items-center overflow-hidden bg-white text-black", className)}
      style={{ containerType: "size", ...style }}
      {...props}
    >
      <GradientBackdrop color1={color1} color2={color2} speed={speed} />

      {(title1 || title2 || description || children) && (
        <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center pb-8 pt-8 md:pb-20 md:pt-20">
          <div className="flex w-full max-w-[1200px] flex-col items-center px-6">
            <div className="mb-8 flex flex-col items-center gap-2 text-center md:mb-12 md:gap-4">
              {title1 && (
                <div className="overflow-hidden">
                  <motion.h1
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className={HERO_HEADLINE_CLASS}
                  >
                    {title1}
                  </motion.h1>
                </div>
              )}
              {title2 && (
                <div className="overflow-hidden">
                  <motion.h1
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
                    className={HERO_HEADLINE_CLASS}
                  >
                    {title2}
                  </motion.h1>
                </div>
              )}
            </div>

            {description && (
              <div className="mb-8 max-w-[480px] text-center">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                  className="text-lg font-normal leading-relaxed text-ink-2 md:text-[1.35rem]"
                >
                  {description}
                </motion.p>
              </div>
            )}

            {children && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
