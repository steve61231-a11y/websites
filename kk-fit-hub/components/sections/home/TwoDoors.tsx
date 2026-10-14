import { doors } from "@/content/home";
import { ButtonLink } from "@/components/ui/Button";
import { SectionShell } from "@/components/site/SectionShell";
import { MotionSlot } from "@/motion/MotionSlot";

/** 6.12 Two doors: final conversion for schools (green) and coaches (orange). */
export function TwoDoors() {
  return (
    <SectionShell theme="dark" pad={false} aria-label="Get started">
      <MotionSlot id="doors-split" className="flex flex-col lg:flex-row">
        <div
          data-door="schools"
          data-reveal
          className="bg-door-schools grain flex min-h-[440px] flex-1 flex-col justify-end px-(--gutter) py-16 lg:min-h-[560px] lg:px-16 lg:py-20"
        >
          <p className="type-eyebrow text-green-500!">{doors.schools.kicker}</p>
          <h2 className="type-display-l mt-4 max-w-[12ch]">{doors.schools.title}</h2>
          <p className="type-lead mt-5 max-w-[30ch] text-fg-2">{doors.schools.body}</p>
          <div className="mt-10">
            <ButtonLink href={doors.schools.cta.href} cta={doors.schools.cta.cta} size="lg" magnetic className="w-full sm:w-auto">
              {doors.schools.cta.label}
            </ButtonLink>
          </div>
        </div>
        <div
          data-door="coaches"
          data-reveal
          style={{ "--i": 1 } as React.CSSProperties}
          className="bg-door-coaches grain flex min-h-[440px] flex-1 flex-col justify-end border-t border-hairline px-(--gutter) py-16 lg:min-h-[560px] lg:border-t-0 lg:border-l lg:px-16 lg:py-20"
        >
          <p className="type-eyebrow text-orange-500!">{doors.coaches.kicker}</p>
          <h2 className="type-display-l mt-4 max-w-[12ch]">{doors.coaches.title}</h2>
          <p className="type-lead mt-5 max-w-[30ch] text-fg-2">{doors.coaches.body}</p>
          <div className="mt-10">
            <ButtonLink
              href={doors.coaches.cta.href}
              cta={doors.coaches.cta.cta}
              variant="coach"
              size="lg"
              magnetic
              className="w-full sm:w-auto"
            >
              {doors.coaches.cta.label}
            </ButtonLink>
          </div>
        </div>
      </MotionSlot>
    </SectionShell>
  );
}
