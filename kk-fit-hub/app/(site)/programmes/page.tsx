import type { Metadata } from "next";
import { Suspense } from "react";
import { programmesPage } from "@/content/pages";
import { TextLink } from "@/components/ui/Button";
import { SectionShell } from "@/components/site/SectionShell";
import { PageHero } from "@/components/sections/shared/PageHero";
import { ProgrammeGrid, ProgrammeGridFallback } from "@/components/sections/programmes/ProgrammeGrid";
import { getActivities } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Programmes",
  description:
    "Kenpo Karate is available now. Chess, skating, ballet, modern dance, music, and coding and robotics are launching soon.",
  alternates: { canonical: "/programmes" },
};

export default async function ProgrammesPage() {
  const activities = await getActivities();
  return (
    <>
      <PageHero title={programmesPage.h1} sub={programmesPage.lead} className="pb-0! lg:pb-0!" />
      <SectionShell theme="light" className="pt-0!">
        <div className="container-site">
          <Suspense fallback={<ProgrammeGridFallback activities={activities} />}>
            <ProgrammeGrid activities={activities} />
          </Suspense>
        </div>
      </SectionShell>
      <SectionShell theme="tint" className="py-20! lg:py-24!" aria-label={programmesPage.endBand.title}>
        <div className="container-site flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="type-h3">{programmesPage.endBand.title}</p>
          <TextLink href={programmesPage.endBand.href} cta={programmesPage.endBand.cta}>
            {programmesPage.endBand.label}
          </TextLink>
        </div>
      </SectionShell>
    </>
  );
}
