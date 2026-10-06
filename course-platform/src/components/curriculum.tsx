"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { formatDuration } from "@/lib/catalog";
import type { Module } from "@/lib/types";
import { ChevronDown, Doc, Play } from "./icons";

export function Curriculum({ modules }: { modules: Module[] }) {
  const [open, setOpen] = useState<string | null>(modules[0]?.id ?? null);

  return (
    <ul className="border-t border-line">
      {modules.map((m) => {
        const isOpen = open === m.id;
        const total = m.lessons.reduce((s, l) => s + l.durationSec, 0);
        return (
          <li key={m.id} className="border-b border-line">
            <button
              onClick={() => setOpen(isOpen ? null : m.id)}
              className="flex w-full items-center gap-5 py-6 text-left"
              aria-expanded={isOpen}
            >
              <span className="w-8 shrink-0 text-[13px] font-medium tabular-nums text-faint">
                {String(m.position).padStart(2, "0")}
              </span>
              <span className="flex-1">
                <span className="block text-[19px] font-semibold tracking-[-0.015em] sm:text-[21px]">{m.title}</span>
                <span className="mt-0.5 block text-[14px] text-muted">
                  {m.lessons.length} {m.lessons.length === 1 ? "lesson" : "lessons"} · {formatDuration(total)}
                  {m.quiz ? " · Quiz" : ""}
                </span>
              </span>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="text-faint">
                <ChevronDown />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="pb-4 pl-13 text-[15px] text-muted">{m.summary}</p>
                  <ul className="pb-6 pl-13">
                    {m.lessons.map((l) => (
                      <li key={l.id} className="flex items-center gap-3 py-2 text-[15px]">
                        <Play size={12} className="text-faint" />
                        <span className="flex-1">{l.title}</span>
                        <span className="tabular-nums text-faint">{Math.round(l.durationSec / 60)} min</span>
                      </li>
                    ))}
                    {m.quiz && (
                      <li className="flex items-center gap-3 py-2 text-[15px]">
                        <Doc size={14} className="text-faint" />
                        <span className="flex-1">Module quiz</span>
                        <span className="text-faint">{m.quiz.questions.length} questions</span>
                      </li>
                    )}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
