import { Award, GraduationCap, Workflow } from "lucide-react";
import { whyNow } from "@/content/home";
import { TextLink } from "@/components/ui/Button";
import { Eyebrow, SectionShell } from "@/components/site/SectionShell";
import { MotionSlot } from "@/motion/MotionSlot";

const icons = { award: Award, workflow: Workflow, graduation: GraduationCap };

/** 6.5 Why now (CONFIRM with Kennedy): a reason for directors to act this year. */
export function WhyNow() {
  return (
    <SectionShell theme="tint" aria-labelledby="whynow-title">
      <div className="container-site grid gap-12 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <Eyebrow>{whyNow.kicker}</Eyebrow>
          <h2 id="whynow-title" className="type-display-l">
            {whyNow.h2}
          </h2>
          <p className="type-lead mt-6 text-fg-2">{whyNow.body}</p>
          <TextLink href={whyNow.link.href} cta={whyNow.link.cta} className="mt-6">
            {whyNow.link.label}
          </TextLink>
        </div>
        <MotionSlot id="whynow-points" className="lg:col-span-5 lg:col-start-8">
          <ul className="flex flex-col gap-4">
            {whyNow.points.map((p, i) => {
              const Icon = icons[p.icon];
              return (
                <li
                  key={p.title}
                  data-reveal
                  style={{ "--i": i } as React.CSSProperties}
                  className="flex gap-5 rounded-[24px] bg-paper p-6 lg:p-7"
                >
                  <Icon aria-hidden="true" size={24} strokeWidth={1.5} className="mt-0.5 shrink-0 text-green-700" />
                  <div>
                    <h3 className="text-[19px] font-semibold">{p.title}</h3>
                    <p className="mt-1 text-text-2">{p.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </MotionSlot>
      </div>
    </SectionShell>
  );
}
