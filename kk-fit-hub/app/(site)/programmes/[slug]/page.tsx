import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { soonPage } from "@/content/pages";
import { ButtonLink, TextLink } from "@/components/ui/Button";
import { ActivityGlyph } from "@/components/ui/ActivityGlyph";
import { StatusChip } from "@/components/ui/Chip";
import { SectionShell } from "@/components/site/SectionShell";
import { PageHero } from "@/components/sections/shared/PageHero";
import { ProgrammeCard } from "@/components/sections/shared/ProgrammeCard";
import { getActivities, getActivity } from "@/lib/data/public";

export async function generateStaticParams() {
  const activities = await getActivities();
  return activities.filter((a) => a.slug !== "kenpo-karate").map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/programmes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const activity = await getActivity(slug);
  if (!activity) return {};
  return {
    title: `${activity.name} for schools`,
    description: `${activity.oneLiner} ${activity.name} is launching soon at KK Fit Hub. Register your school's interest.`,
    alternates: { canonical: `/programmes/${activity.slug}` },
  };
}

/** 7.3 Launching-soon template. */
export default async function ProgrammePage({ params }: PageProps<"/programmes/[slug]">) {
  const { slug } = await params;
  const [activity, all] = await Promise.all([getActivity(slug), getActivities()]);
  if (!activity) notFound();
  const others = all.filter((a) => a.slug !== activity.slug);
  const available = activity.status === "available";

  return (
    <>
      <PageHero
        eyebrow={<StatusChip status={available ? "available" : "soon"} />}
        title={activity.name}
        sub={activity.oneLiner}
        aside={
          <div aria-hidden="true" className="grid aspect-square w-full max-w-[360px] place-items-center rounded-full bg-paper text-green-700 lg:ml-auto">
            <ActivityGlyph id={activity.glyph} size={160} strokeWidth={1} />
          </div>
        }
      >
        {available ? (
          <ButtonLink href={`/request?activity=${activity.slug}&source=programme`} cta="programme-primary" size="lg">
            Request a demonstration
          </ButtonLink>
        ) : (
          <ButtonLink href={`/request?activity=${activity.slug}&type=interest`} cta="soon-interest" size="lg" magnetic>
            {soonPage.interest}
          </ButtonLink>
        )}
      </PageHero>

      {!available && (
        <SectionShell theme="light" className="pt-0!" aria-label={activity.name}>
          <div className="container-text">
            <p className="type-lead measure text-fg-2">{soonPage.body(activity.name)}</p>
          </div>
        </SectionShell>
      )}

      {activity.outcomes.length > 0 && (
        <SectionShell theme="tint" aria-labelledby="why-title">
          <div className="container-site">
            <h2 id="why-title" className="type-display-l">
              {soonPage.whyTitle(activity.name)}
            </h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {activity.outcomes.slice(0, 3).map((o, i) => (
                <li
                  key={o}
                  data-reveal
                  style={{ "--i": i } as React.CSSProperties}
                  className="rounded-[24px] bg-paper p-6 type-h3 lg:p-8"
                >
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </SectionShell>
      )}

      <SectionShell theme="dark" className="bg-door-coaches grain" aria-labelledby="coach-band-title">
        <div className="container-site flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <h2 id="coach-band-title" className="type-display-l max-w-[16ch]">
            {soonPage.coachBand(activity.name)}
          </h2>
          <TextLink href={`/join/apply?activity=${activity.slug}`} cta="soon-coach" tone="coach">
            {soonPage.coachLink(activity.name)}
          </TextLink>
        </div>
      </SectionShell>

      <SectionShell theme="light" aria-labelledby="others-title">
        <div className="container-site">
          <h2 id="others-title" className="type-h3">
            {soonPage.othersTitle}
          </h2>
          <ul className="no-scrollbar -mx-(--gutter) mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-(--gutter) px-(--gutter) pb-2">
            {others.map((a) => (
              <li key={a.slug} className="w-[80%] shrink-0 snap-start sm:w-[44%] lg:w-[300px]">
                <ProgrammeCard activity={a} />
              </li>
            ))}
          </ul>
        </div>
      </SectionShell>
    </>
  );
}
