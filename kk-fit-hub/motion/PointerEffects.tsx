"use client";

import { animate } from "motion";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

const spring = { stiffness: 260, damping: 30 };

/**
 * Tier A only (PRD 11.6): an 8px cursor follower with spring lag that grows
 * to 48px with a label over cards and hides over inputs and text; primary
 * and coach buttons pull up to 8px toward the pointer within 80px. The
 * system cursor stays visible.
 */
export default function PointerEffects() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);
  const [label, setLabel] = useState<string | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const magnets = new Map<HTMLElement, boolean>();
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      const target = e.target as HTMLElement | null;
      const overText = Boolean(target?.closest("input, textarea, select, p, h1, h2, h3, li:not([data-hub-card]) > span, label"));
      const card = target?.closest<HTMLElement>("[data-cursor-label]");
      setLabel(card?.dataset.cursorLabel ?? null);
      setHidden(overText && !card);

      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const near = Math.abs(dx) < r.width / 2 + 80 && Math.abs(dy) < r.height / 2 + 80;
        if (near) {
          magnets.set(el, true);
          const pull = (v: number, half: number) => Math.max(-8, Math.min(8, (v / (half + 80)) * 8));
          void animate(el, { x: pull(dx, r.width / 2), y: pull(dy, r.height / 2) }, { type: "spring", ...spring });
        } else if (magnets.get(el)) {
          magnets.set(el, false);
          void animate(el, { x: 0, y: 0 }, { type: "spring", ...spring });
        }
      });
    };
    const onLeave = () => setHidden(true);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      magnets.forEach((_, el) => (el.style.transform = ""));
    };
  }, [x, y]);

  return (
    <motion.div
      aria-hidden="true"
      style={{ x: sx, y: sy, pointerEvents: "none", position: "fixed", left: 0, top: 0, zIndex: 70 }}
    >
      <motion.div
        animate={{ width: label ? 48 : 8, height: label ? 48 : 8, opacity: hidden ? 0 : 1 }}
        transition={{ type: "spring", ...spring }}
        style={{ translateX: "-50%", translateY: "-50%" }}
        className="grid place-items-center rounded-full bg-green-600 text-[11px] font-semibold text-white mix-blend-normal"
      >
        {label}
      </motion.div>
    </motion.div>
  );
}
