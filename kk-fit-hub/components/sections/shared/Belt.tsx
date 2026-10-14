import type { Step } from "@/content/home";
import { MotionSlot } from "@/motion/MotionSlot";

/**
 * "Our standard" belt (PRD 6.7, 10.7): five rounded segments from paper to
 * ink, three thin orange stripes on the last (a nod to Kennedy's 3rd degree).
 * A stylised progression, not a real Kenpo grading order. Desktop:
 * horizontal with labels beneath; mobile: vertical with labels to the right.
 */
const segmentColours = ["#F2F2F0", "#A9D8B5", "#3AA655", "#1F6332", "#0B0B0C"];

export function Belt({ stages }: { stages: Step[] }) {
  return (
    <MotionSlot id="standard-belt">
      <ol className="grid grid-cols-[28px_1fr] gap-x-6 lg:grid-cols-5 lg:gap-x-2">
        {stages.map((stage, i) => {
          const last = i === stages.length - 1;
          return (
            <li key={stage.title} className="contents lg:block">
              <span
                aria-hidden="true"
                data-reveal
                data-belt-segment={i}
                style={{ "--i": i, backgroundColor: segmentColours[i] } as React.CSSProperties}
                className={[
                  "relative block min-h-24 w-7 overflow-hidden outline outline-1 -outline-offset-1 outline-hairline lg:h-7 lg:min-h-0 lg:w-full",
                  i === 0 ? "rounded-t-full lg:rounded-l-full lg:rounded-tr-none" : "",
                  last ? "rounded-b-full lg:rounded-r-full lg:rounded-bl-none" : "",
                ].join(" ")}
              >
                {last && (
                  <span data-belt-stripes className="absolute inset-0 flex flex-col items-stretch justify-end gap-[5px] px-0 py-5 lg:flex-row lg:justify-end lg:px-5 lg:py-0">
                    {[0, 1, 2].map((s) => (
                      <span key={s} className="block h-[3px] w-full bg-orange-500 lg:h-full lg:w-[3px]" />
                    ))}
                  </span>
                )}
              </span>
              <div className="pb-8 lg:pt-6 lg:pr-4 lg:pb-0">
                <p className="type-small font-semibold text-accent-text tabular">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-1 text-[19px] font-semibold">{stage.title}</h3>
                <p className="mt-1 text-fg-2">{stage.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </MotionSlot>
  );
}
