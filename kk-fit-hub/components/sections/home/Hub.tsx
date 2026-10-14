import type { Activity } from "@/content/activities";
import { hub } from "@/content/home";
import { TextLink } from "@/components/ui/Button";
import { SectionShell } from "@/components/site/SectionShell";
import { MotionSlot } from "@/motion/MotionSlot";
import { HubStage } from "./HubStage";

/** 6.4 The Hub: every activity, and what's coming. */
export function Hub({ activities }: { activities: Activity[] }) {
  return (
    <SectionShell theme="light" aria-labelledby="hub-title" className="overflow-hidden">
      <div className="container-site">
        <div className="mx-auto max-w-[760px] text-center">
          <h2 id="hub-title" className="type-display-l">
            {hub.h2}
          </h2>
          <p className="type-lead mt-6 text-fg-2">{hub.lead}</p>
        </div>
      </div>
      <MotionSlot id="hub-particles" className="mt-12 lg:mt-16">
        <HubStage activities={activities} />
      </MotionSlot>
      <div className="container-site mt-8 text-center">
        <p className="mx-auto max-w-[56ch] type-small text-fg-2">{hub.footnote}</p>
        <TextLink href={hub.all.href} cta={hub.all.cta} className="mt-4">
          {hub.all.label}
        </TextLink>
      </div>
    </SectionShell>
  );
}
