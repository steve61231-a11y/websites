import { ViewTransition } from "react";
import type { Module } from "@/lib/types";
import { Check, Lock } from "@/components/icons";

export type EpisodeState = "complete" | "current" | "locked";

/**
 * An episode's cover. Carries a shared view-transition name, so tapping it
 * morphs the thumbnail into the player on the lesson page.
 */
export function EpisodeThumb({
  episode,
  state,
  progress = 0,
  className = "",
  morph = true,
  large = false,
  code,
  name,
}: {
  episode: Module;
  /** Show a lesson code like "2.3" instead of the day number. */
  code?: string;
  /** Shared transition name; defaults to the episode's. */
  name?: string;
  state?: EpisodeState;
  progress?: number;
  className?: string;
  morph?: boolean;
  large?: boolean;
}) {
  const number = code ?? (episode.kind === "day" ? String(episode.position).padStart(2, "0") : episode.kind === "welcome" ? "00" : "08");
  const body = (
    <div className={`@container relative aspect-video overflow-hidden rounded-[14px] bg-surface ${className}`}>
      <img src={episode.still} alt="" loading="lazy" className={`absolute inset-0 h-full w-full object-cover ${state === "locked" ? "opacity-40 grayscale" : ""}`} />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/10 to-transparent" />
      <span
        aria-hidden
        className={`absolute bottom-[6cqw] left-[7cqw] font-[family-name:var(--font-display)] font-extrabold leading-none tracking-[-0.06em] text-white ${code && code.length > 2 ? "text-[20cqw]" : large ? "text-[22cqw]" : "text-[26cqw]"}`}
      >
        {number}
      </span>
      {state === "complete" && (
        <span className="absolute right-[5cqw] top-[5cqw] grid size-[clamp(18px,13cqw,28px)] place-items-center rounded-full bg-amber text-black">
          <Check className="size-[65%]" strokeWidth={3} />
        </span>
      )}
      {state === "locked" && (
        <span className="absolute right-[5cqw] top-[5cqw] grid size-[clamp(18px,13cqw,28px)] place-items-center rounded-full bg-black/60 text-white/80 backdrop-blur">
          <Lock className="size-[55%]" />
        </span>
      )}
      {progress > 0 && progress < 1 && state !== "complete" && (
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
          <div className="h-full bg-amber" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </div>
  );
  return morph ? (
    <ViewTransition name={name ?? `ep-${episode.slug}`} share="morph" default="none">
      {body}
    </ViewTransition>
  ) : (
    body
  );
}
