import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionShell } from "@/components/site/SectionShell";
import { RequestForm } from "@/components/forms/RequestForm";
import { getActivities, getSettings } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Request a demonstration",
  description:
    "Request a KK Fit Hub demonstration at your school. Tell us about your learners and we'll bring the demonstration.",
  alternates: { canonical: "/request" },
};

/** /request: demonstration request and register interest (PRD 8.1). */
export default async function RequestPage() {
  const [activities, settings] = await Promise.all([getActivities(), getSettings()]);
  return (
    <SectionShell
      theme="light"
      pad={false}
      className="bg-canvas-lift overflow-x-clip pt-[calc(var(--header-h)+48px)] pb-24 lg:pt-[calc(var(--header-h)+96px)] lg:pb-32"
    >
      <div className="mx-auto max-w-[calc(720px+2*var(--gutter))] px-(--gutter)">
        <Suspense fallback={<FormFallback />}>
          <RequestForm
            activities={activities}
            counties={settings.counties}
            whatsappE164={settings.whatsappE164}
            responseTimeText={settings.responseTimeText}
            startTermOptions={settings.startTermOptions}
          />
        </Suspense>
      </div>
    </SectionShell>
  );
}

function FormFallback() {
  return (
    <div aria-busy="true">
      <h1 className="type-display-l">Request a demonstration</h1>
      <div className="mt-14 grid gap-6" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[84px] rounded-[14px] bg-paper/60" />
        ))}
      </div>
    </div>
  );
}
