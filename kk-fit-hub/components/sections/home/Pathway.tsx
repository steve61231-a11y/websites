import { pathway } from "@/content/home";
import { Eyebrow, SectionShell } from "@/components/site/SectionShell";
import { MotionSlot } from "@/motion/MotionSlot";

/** 6.10 The pathway: the ambition, drawn with the energy line. */
export function Pathway() {
  return (
    <SectionShell theme="dark" className="pt-0!" aria-labelledby="pathway-title">
      <div className="container-site">
        <div className="max-w-[760px]">
          <Eyebrow>{pathway.kicker}</Eyebrow>
          <h2 id="pathway-title" className="type-display-l">
            {pathway.h2}
          </h2>
          <p className="type-lead mt-6 text-fg-2">{pathway.body}</p>
        </div>
        <MotionSlot id="pathway-run" className="relative mt-14 lg:mt-20">
          <span
            aria-hidden="true"
            data-pathway-line
            className="bg-energy-line absolute top-2 bottom-2 left-[7px] w-[2px] rounded-full [background:linear-gradient(180deg,#3aa655,#b18600,#e4572e)] lg:top-[7px] lg:right-0 lg:bottom-auto lg:left-0 lg:h-[2px] lg:w-auto lg:[background:var(--energy-line)]"
          />
          <span aria-hidden="true" data-pathway-dot className="absolute hidden" />
          <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-6">
            {pathway.milestones.map((m, i) => (
              <li
                key={m}
                data-reveal
                data-milestone={i}
                style={{ "--i": i } as React.CSSProperties}
                className="flex items-center gap-5 lg:block"
              >
                <span
                  aria-hidden="true"
                  className="block size-4 shrink-0 rounded-full border-2 border-canvas bg-ink-900"
                  data-milestone-dot
                />
                <span className="type-h3 lg:mt-6 lg:block">{m}</span>
              </li>
            ))}
          </ol>
        </MotionSlot>
      </div>
    </SectionShell>
  );
}
