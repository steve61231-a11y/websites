import type { Metadata } from "next";
import { Suspense } from "react";
import map from "@/content/kenya-map.json";
import { SectionShell } from "@/components/site/SectionShell";
import { ApplicationForm } from "@/components/forms/ApplicationForm";
import { getActivities, getOpenRoles, getSettings } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Apply to join the team",
  description: "Apply to coach with KK Fit Hub. About 10 minutes: your details, your discipline, proof and checks, availability.",
  alternates: { canonical: "/join/apply" },
};

const allCounties = map.counties.map((c) => c.name);

/** /join/apply: the coach application (PRD 8.2). */
export default async function ApplyPage() {
  const [activities, settings, roles] = await Promise.all([getActivities(), getSettings(), getOpenRoles()]);
  return (
    <SectionShell
      theme="light"
      pad={false}
      className="bg-canvas-lift overflow-x-clip pt-[calc(var(--header-h)+48px)] pb-24 lg:pt-[calc(var(--header-h)+96px)] lg:pb-32"
    >
      <div className="mx-auto max-w-[calc(720px+2*var(--gutter))] px-(--gutter)">
        <Suspense
          fallback={
            <div aria-busy="true">
              <h1 className="type-display-l">Apply to join the team</h1>
              <div className="mt-14 grid gap-6" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-[84px] rounded-[14px] bg-paper/60" />
                ))}
              </div>
            </div>
          }
        >
          <ApplicationForm
            activities={activities}
            servedCounties={settings.counties}
            allCounties={allCounties}
            roles={roles.map((r) => ({ id: r.id, title: r.title, activitySlug: r.activitySlug }))}
          />
        </Suspense>
      </div>
    </SectionShell>
  );
}
