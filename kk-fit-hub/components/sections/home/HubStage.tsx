"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Activity } from "@/content/activities";
import { cn } from "@/lib/cn";
import { ActivityGlyph } from "@/components/ui/ActivityGlyph";
import { StatusChip } from "@/components/ui/Chip";

/**
 * The hub stage and card row (PRD 6.4). Hovering or focusing a card (or, on
 * touch, the card snapped to centre) sets the active activity. The default
 * stage is a grid of the seven glyphs with the active one highlighted; the
 * enhanced particle scene reads `data-active-glyph` from the stage.
 */
export function HubStage({ activities }: { activities: Activity[] }) {
  const [active, setActive] = useState(0);
  const rowRef = useRef<HTMLUListElement>(null);

  // Touch: the card closest to the centre of the row drives the stage.
  useEffect(() => {
    const row = rowRef.current;
    if (!row || !window.matchMedia("(hover: none)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const centre = row.getBoundingClientRect().left + row.clientWidth / 2;
        let best = 0;
        let bestDist = Infinity;
        row.querySelectorAll<HTMLElement>("[data-hub-card]").forEach((card, i) => {
          const r = card.getBoundingClientRect();
          const d = Math.abs(r.left + r.width / 2 - centre);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        });
        setActive(best);
      });
    };
    row.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      row.removeEventListener("scroll", onScroll);
    };
  }, []);

  const current = activities[active];

  return (
    <>
      <div
        data-hub-stage
        data-active-glyph={current?.glyph}
        data-active-index={active}
        className="relative mx-auto h-[320px] max-w-[1200px] px-(--gutter) lg:h-[520px]"
      >
        <ul
          aria-hidden="true"
          data-hub-default
          className="grid h-full grid-cols-4 place-content-center place-items-center gap-x-4 gap-y-6 sm:gap-x-10 lg:grid-cols-7 lg:gap-x-12"
        >
          {activities.map((a, i) => (
            <li
              key={a.slug}
              className={cn(
                "grid size-16 place-items-center rounded-full transition-[color,transform,opacity] duration-(--dur-small) lg:size-24",
                i === active ? "scale-110 bg-paper text-green-700 opacity-100" : "text-text-3 opacity-60",
              )}
            >
              <ActivityGlyph id={a.glyph} size={i === active ? 40 : 32} strokeWidth={1.5} className="lg:hidden" />
              <ActivityGlyph id={a.glyph} size={i === active ? 56 : 44} strokeWidth={1.5} className="hidden lg:block" />
            </li>
          ))}
        </ul>
        <p className="sr-only" aria-live="polite">
          {current ? `${current.name}: ${current.oneLiner}` : ""}
        </p>
      </div>

      <ul
        ref={rowRef}
        className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-(--gutter) px-(--gutter) pb-2 lg:mx-auto lg:max-w-[calc(1200px+2*var(--gutter))]"
      >
        {activities.map((a, i) => (
          <li key={a.slug} data-hub-card className="w-[85%] shrink-0 snap-start sm:w-[44%] lg:w-[260px]">
            <Link
              href={`/programmes/${a.slug}`}
              data-cta="hub-card"
              data-cursor-label={a.status === "available" ? "View" : undefined}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className={cn(
                "press flex h-full flex-col rounded-[24px] border bg-surface p-6 lg:p-7",
                i === active ? "border-green-600/40" : "border-hairline",
              )}
            >
              <span className="flex items-start justify-between gap-3">
                <ActivityGlyph id={a.glyph} size={28} className="text-green-700" />
                {a.status !== "hidden" && <StatusChip status={a.status} />}
              </span>
              <span className="mt-6 type-h3">{a.name}</span>
              <span className="mt-2 text-fg-2">{a.oneLiner}</span>
              <span className="mt-auto pt-6 font-semibold text-accent-text">
                {a.status === "available" ? "Explore" : "Register interest"} <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
