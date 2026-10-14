import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, MapPin, ShieldCheck, Star } from "lucide-react";
import { photos } from "@/content/media";
import { joinPage } from "@/content/pages";
import { Accordion } from "@/components/ui/Accordion";
import { ButtonLink } from "@/components/ui/Button";
import { ActivityGlyph } from "@/components/ui/ActivityGlyph";
import { chipClass } from "@/components/ui/Chip";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { Eyebrow, SectionShell } from "@/components/site/SectionShell";
import { EndBand } from "@/components/sections/shared/EndBand";
import { PageHero } from "@/components/sections/shared/PageHero";
import { ProcessSteps } from "@/components/sections/shared/ProcessSteps";
import { getActivities, getOpenRoles } from "@/lib/data/public";
import { JsonLd, faqJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Coach with us",
  description:
    "Professional coaches and instructors: apply to join KK Fit Hub and coach in schools across Kenya.",
  alternates: { canonical: "/join" },
};

const lookingIcons = [Star, ShieldCheck, Clock];

/** 7.5 Join the Team. */
export default async function JoinPage() {
  const [activities, roles] = await Promise.all([getActivities(), getOpenRoles()]);
  const recruiting = activities.filter((a) => a.recruiting);

  return (
    <>
      <JsonLd data={faqJsonLd(joinPage.faqs)} />
      <PageHero
        theme="dark"
        className="bg-[radial-gradient(60%_50%_at_70%_60%,rgb(228_87_46/0.22),transparent_70%),var(--ink-900)]!"
        eyebrow={<p className="type-eyebrow text-orange-500!">{joinPage.kicker}</p>}
        title={joinPage.h1}
        sub={joinPage.sub}
        aside={
          <PhotoSlot photo={photos["detail-belt"]} priority sizes="(min-width: 1024px) 40vw, 100vw" className="aspect-[4/3] w-full" />
        }
      >
        <ButtonLink href={joinPage.primary.href} cta={joinPage.primary.cta} variant="coach" size="lg" magnetic>
          {joinPage.primary.label}
        </ButtonLink>
      </PageHero>

      <SectionShell theme="light" aria-labelledby="looking-title">
        <div className="container-site">
          <h2 id="looking-title" className="type-display-l">
            {joinPage.lookingTitle}
          </h2>
          <ul className="mt-12 grid gap-4 md:grid-cols-3 lg:gap-6">
            {joinPage.looking.map((c, i) => {
              const Icon = lookingIcons[i];
              return (
                <li
                  key={c.title}
                  data-reveal
                  style={{ "--i": i } as React.CSSProperties}
                  className="rounded-[24px] border border-hairline bg-surface p-6 lg:p-8"
                >
                  <Icon aria-hidden="true" size={24} strokeWidth={1.5} className="text-orange-700" />
                  <h3 className="mt-6 type-h3">{c.title}</h3>
                  <p className="mt-2 text-fg-2">{c.body}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </SectionShell>

      {recruiting.length > 0 && (
        <SectionShell theme="light" className="pt-0!" aria-labelledby="recruiting-title">
          <div className="container-site">
            <h2 id="recruiting-title" className="type-h3">
              {joinPage.recruitingTitle}
            </h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {recruiting.map((a) => (
                <li key={a.slug}>
                  <Link href={`/join/apply?activity=${a.slug}`} data-cta="recruiting-chip" className={chipClass}>
                    <ActivityGlyph id={a.glyph} size={20} className="text-orange-700" />
                    {a.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </SectionShell>
      )}

      <SectionShell theme="light" id="open-roles" className="pt-0!" aria-labelledby="roles-title">
        <div className="container-site">
          <h2 id="roles-title" className="type-display-l">
            {joinPage.rolesTitle}
          </h2>
          {roles.length === 0 ? (
            <p className="type-lead mt-6 max-w-[40ch] text-fg-2">{joinPage.rolesEmpty}</p>
          ) : (
            <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:gap-6">
              {roles.map((r) => (
                <li key={r.id} className="flex flex-col rounded-[24px] border border-hairline bg-surface p-6 lg:p-8">
                  <h3 className="type-h3">{r.title}</h3>
                  <p className="mt-2 type-small text-fg-2">
                    {[r.activityName, r.employmentType].filter(Boolean).join(" · ")}
                  </p>
                  {r.counties.length > 0 && (
                    <p className="mt-2 flex items-center gap-2 type-small text-fg-2">
                      <MapPin aria-hidden="true" size={16} strokeWidth={1.5} />
                      {r.counties.join(", ")}
                    </p>
                  )}
                  {r.description && <p className="mt-4 text-fg-2">{r.description}</p>}
                  <div className="mt-auto pt-6">
                    <ButtonLink href={`/join/apply?role=${r.id}`} cta="role-apply" variant="coach" size="sm">
                      {joinPage.roleApply}
                    </ButtonLink>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SectionShell>

      <SectionShell theme="dark" aria-labelledby="join-how-title">
        <div className="container-site">
          <h2 id="join-how-title" className="type-display-l">
            {joinPage.howTitle}
          </h2>
          <div className="mt-12 lg:mt-16">
            <ProcessSteps steps={joinPage.steps} slot={false} />
          </div>
        </div>
      </SectionShell>

      <SectionShell theme="light" aria-labelledby="need-title">
        <div className="container-site grid gap-12 lg:grid-cols-2">
          <div>
            <h2 id="need-title" className="type-display-l">
              {joinPage.needTitle}
            </h2>
            <ul className="mt-8 flex flex-col gap-4">
              {joinPage.need.map((n) => (
                <li key={n} className="flex items-start gap-3 text-[19px]">
                  <CheckCircle2 aria-hidden="true" size={22} strokeWidth={1.5} className="mt-0.5 shrink-0 text-green-700" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Eyebrow>{joinPage.faqTitle}</Eyebrow>
            <Accordion items={joinPage.faqs} />
          </div>
        </div>
      </SectionShell>

      <EndBand title={joinPage.endBand} glow="coaches">
        <ButtonLink href={joinPage.primary.href} cta={joinPage.primary.cta} variant="coach" size="lg" magnetic>
          {joinPage.primary.label}
        </ButtonLink>
      </EndBand>
    </>
  );
}
