"use client";

import { flushSync } from "react-dom";
import { useId, useSyncExternalStore } from "react";

// Dark is the default; a choice is remembered on this device. The attribute
// is set before first paint by THEME_SCRIPT, so there's no flash.

export type Theme = "dark" | "light";
const KEY = "the-prod-theme";

export const THEME_SCRIPT = `try{document.documentElement.dataset.theme=localStorage.getItem("${KEY}")==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

const listeners = new Set<() => void>();

function read(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useTheme() {
  return useSyncExternalStore(subscribe, read, () => "dark" as Theme);
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {}
  listeners.forEach((fn) => fn());
}

/** Switch themes; the new one opens as a circle from where you tapped. */
export function setTheme(theme: Theme, from?: { x: number; y: number }) {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!from || reduce || !document.startViewTransition) return apply(theme);
  const r = Math.hypot(Math.max(from.x, innerWidth - from.x), Math.max(from.y, innerHeight - from.y));
  root.style.setProperty("--theme-x", `${from.x}px`);
  root.style.setProperty("--theme-y", `${from.y}px`);
  root.style.setProperty("--theme-r", `${r}px`);
  root.setAttribute("data-theme-switching", "");
  const t = document.startViewTransition(() => flushSync(() => apply(theme)));
  t.finished.finally(() => root.removeAttribute("data-theme-switching"));
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();
  const dark = theme === "dark";
  const mask = `moon-${useId().replace(/[^\w-]/g, "")}`;
  return (
    <button
      type="button"
      onClick={(e) => {
        const b = e.currentTarget.getBoundingClientRect();
        setTheme(dark ? "light" : "dark", { x: b.left + b.width / 2, y: b.top + b.height / 2 });
      }}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={`group relative grid size-10 shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:bg-white/[0.08] hover:text-white ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
        {/* The sun's rays fold away as the disc becomes a moon. */}
        <mask id={mask}>
          <rect width="24" height="24" fill="#fff" />
          <circle
            cx={dark ? 24 : 17}
            cy={dark ? 0 : 7}
            r="7"
            fill="#000"
            style={{ transition: "cx 500ms cubic-bezier(0.16,1,0.3,1), cy 500ms cubic-bezier(0.16,1,0.3,1)" }}
          />
        </mask>
        <circle
          cx="12"
          cy="12"
          r={dark ? 4.5 : 8}
          fill="currentColor"
          stroke="none"
          mask={`url(#${mask})`}
          style={{ transition: "r 500ms cubic-bezier(0.16,1,0.3,1)" }}
        />
        <g
          style={{
            transformOrigin: "12px 12px",
            transform: dark ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.4)",
            opacity: dark ? 1 : 0,
            transition: "transform 500ms cubic-bezier(0.16,1,0.3,1), opacity 300ms",
          }}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="12" y1="2.5" x2="12" y2="4.5" transform={`rotate(${a} 12 12)`} />
          ))}
        </g>
      </svg>
    </button>
  );
}
