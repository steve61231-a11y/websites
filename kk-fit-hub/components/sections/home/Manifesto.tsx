import { manifesto } from "@/content/home";
import { SectionShell } from "@/components/site/SectionShell";
import { MotionSlot } from "@/motion/MotionSlot";

/** 6.2 Manifesto: the problem and the belief. */
export function Manifesto() {
  return (
    <SectionShell theme="light" className="bg-canvas-lift" aria-label="Our belief">
      <MotionSlot id="manifesto-reveal" className="mx-auto max-w-[calc(880px+2*var(--gutter))] px-(--gutter) text-center">
        <p data-reveal data-manifesto-statement className="type-statement text-balance">
          {manifesto.statement}
        </p>
        <p data-reveal style={{ "--i": 1 } as React.CSSProperties} className="type-lead mx-auto mt-8 max-w-[38em] text-fg-2">
          {manifesto.body}
        </p>
      </MotionSlot>
    </SectionShell>
  );
}
