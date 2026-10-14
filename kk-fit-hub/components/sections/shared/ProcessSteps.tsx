import type { Step } from "@/content/home";
import { MotionSlot } from "@/motion/MotionSlot";

/**
 * Numbered steps joined by one line (PRD 6.6). Desktop: columns; mobile: a
 * vertical line down the left. Reused on For Schools and Join.
 */
export function ProcessSteps({ steps, slot = true }: { steps: Step[]; slot?: boolean }) {
  const five = steps.length === 5;
  const cols = five ? "lg:grid-cols-5" : "lg:grid-cols-4";
  // The line runs from the first number's centre to the last one's.
  const lineEnd = five ? "lg:right-[calc(20%-26px)]" : "lg:right-[calc(25%-28px)]";
  const list = (
    <div className="relative">
      {/* The connecting line. */}
      <span
        aria-hidden="true"
        data-process-line
        className={`absolute top-2 bottom-2 left-[19px] w-px origin-top bg-[color-mix(in_srgb,var(--fg)_20%,transparent)] lg:top-[19px] lg:bottom-auto lg:left-5 lg:h-px lg:w-auto lg:origin-left ${lineEnd}`}
      />
      <ol className={`relative grid gap-10 lg:gap-8 ${cols}`}>
        {steps.map((s, i) => (
          <li
            key={s.title}
            data-reveal
            data-step={i}
            style={{ "--i": i } as React.CSSProperties}
            className="relative grid grid-cols-[40px_1fr] gap-5 lg:block"
          >
            <span
              data-step-number
              className="bg-bg text-accent-text tabular relative z-10 grid size-10 place-items-center rounded-full border border-green-600 font-semibold"
            >
              {i + 1}
            </span>
            <div className="lg:mt-6">
              <h3 className="type-h3">{s.title}</h3>
              {s.body && <p className="text-fg-2 mt-2">{s.body}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
  return slot ? <MotionSlot id="process-line">{list}</MotionSlot> : list;
}
