import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { pathway } from "@/content/home";
import { photos } from "@/content/media";
import { aboutPage } from "@/content/pages";
import { ButtonLink, TextLink } from "@/components/ui/Button";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { Eyebrow, SectionShell } from "@/components/site/SectionShell";
import { EndBand } from "@/components/sections/shared/EndBand";
import { PageHero } from "@/components/sections/shared/PageHero";
import { JsonLd, personJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About Kennedy Kopala and KK Fit Hub",
  description:
    "Built by a coach with more than 20 years in Kenpo Karate, to transform academic learning through extra-curricular activities.",
  alternates: { canonical: "/about" },
};

/** 7.6 About. */
export default function AboutPage() {
  return (
    <>
      <JsonLd data={personJsonLd()} />
      <PageHero
        title={aboutPage.h1}
        sub={aboutPage.sub}
        aside={
          <PhotoSlot
            photo={photos["kennedy-portrait"]}
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="aspect-[4/5] w-full"
          />
        }
      />

      <SectionShell theme="light" className="pt-0!" aria-labelledby="story-title">
        <div className="container-text">
          <h2 id="story-title" className="type-display-l">
            {aboutPage.storyTitle}
          </h2>
          <p className="type-lead measure mt-8 text-fg-2">{aboutPage.story}</p>
        </div>
      </SectionShell>

      <SectionShell theme="dark" aria-label="Mission and vision">
        <div className="container-site grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div data-reveal>
            <Eyebrow>{aboutPage.missionTitle}</Eyebrow>
            <p className="type-statement">{aboutPage.mission}</p>
          </div>
          <div data-reveal style={{ "--i": 1 } as React.CSSProperties}>
            <Eyebrow>{aboutPage.visionTitle}</Eyebrow>
            <p className="type-statement">{aboutPage.vision}</p>
          </div>
        </div>
        <div className="container-site mt-20">
          <p className="type-eyebrow mb-4">{pathway.kicker}</p>
          <p className="type-h3">{pathway.h2}</p>
        </div>
      </SectionShell>

      <SectionShell theme="light" aria-labelledby="values-title">
        <div className="container-site">
          <h2 id="values-title" className="type-display-l">
            {aboutPage.valuesTitle}
          </h2>
          <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {aboutPage.values.map((v, i) => (
              <li
                key={v.title}
                data-reveal
                style={{ "--i": i } as React.CSSProperties}
                className="rounded-[24px] border border-hairline bg-surface p-6"
              >
                <h3 className="text-[19px] font-semibold">{v.title}</h3>
                <p className="mt-2 text-fg-2">{v.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </SectionShell>

      <SectionShell theme="tint" aria-labelledby="credentials-title">
        <div className="container-site">
          <h2 id="credentials-title" className="type-display-l">
            {aboutPage.credentialsTitle}
          </h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {aboutPage.credentials.map((c) => (
              <li key={c} className="flex items-start gap-3 rounded-[24px] bg-paper p-6 text-[19px] font-semibold">
                <BadgeCheck aria-hidden="true" size={24} strokeWidth={1.5} className="shrink-0 text-green-700" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </SectionShell>

      <EndBand title={aboutPage.h1}>
        <ButtonLink href={aboutPage.primary.href} cta={aboutPage.primary.cta} size="lg" magnetic>
          {aboutPage.primary.label}
        </ButtonLink>
        <TextLink href={aboutPage.coach.href} cta={aboutPage.coach.cta} className="justify-center">
          {aboutPage.coach.label}
        </TextLink>
      </EndBand>
    </>
  );
}
