import type { Lesson, Module } from "@/lib/types";
import { Check, Doc } from "./icons";

// Typographic lesson thumbnails ("3.2"), so every lesson has a consistent,
// designed cover without needing artwork. When real thumbnails exist they
// can replace the background while keeping the badges.

export function moduleHue(position: number) {
  return (205 + position * 23) % 360;
}

type Props = {
  module: Module;
  lesson?: Lesson; // omit for the module quiz tile
  index?: number;
  done?: boolean;
  current?: boolean;
  progress?: number; // 0–1 watched
  className?: string;
};

export function LessonThumb({ module, lesson, index = 0, done, current, progress = 0, className = "" }: Props) {
  const hue = moduleHue(module.position);
  const label = lesson ? `${module.position}.${index + 1}` : "Quiz";
  const words = (lesson?.title ?? module.title).toUpperCase();

  return (
    <div className={`@container relative aspect-video shrink-0 overflow-hidden rounded-[10px] ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 78% 18%, hsl(${hue} 70% 42% / 0.55), transparent 55%),
            linear-gradient(150deg, hsl(${hue} 30% 16%), #050505 75%)`,
        }}
      />
      {/* Iris motif */}
      <svg viewBox="0 0 100 100" className="absolute -right-[12%] -bottom-[30%] h-[110%] opacity-[0.16]" aria-hidden>
        <circle cx="50" cy="50" r="46" fill="none" stroke="white" strokeWidth="1.2" />
        <path d="M50 22 74 36v28L50 78 26 64V36Z" fill="none" stroke="white" strokeWidth="1.2" />
      </svg>
      <div className="relative flex h-full flex-col justify-between p-[7cqw] text-white">
        <p className="line-clamp-2 max-w-[78%] text-[6.6cqw] font-semibold leading-[1.15] tracking-[0.04em] text-white/70">
          {words}
        </p>
        <p className="text-[24cqw] font-bold leading-[0.85] tracking-[-0.05em]">
          {lesson ? label : <Doc className="size-[22cqw]" strokeWidth={1.6} />}
        </p>
      </div>

      {done && (
        <span className="absolute right-[5cqw] top-[5cqw] grid size-[16cqw] max-h-6 max-w-6 place-items-center rounded-full bg-success text-white">
          <Check className="size-[70%]" strokeWidth={3} />
        </span>
      )}
      {current && !done && (
        <span className="absolute right-[5cqw] top-[5cqw] flex h-[14cqw] max-h-5 items-end gap-[2px] rounded-full bg-white px-[4cqw] py-[3.5cqw]" aria-label="Now playing">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-[2px] origin-bottom animate-[eq_1s_ease-in-out_infinite] rounded-full bg-accent"
              style={{ height: "100%", animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </span>
      )}
      {progress > 0 && !done && (
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25">
          <div className="h-full bg-accent" style={{ width: `${Math.min(100, progress * 100)}%` }} />
        </div>
      )}
    </div>
  );
}
