import type { Metadata } from "next";
import { Check, ShieldCheck } from "lucide-react";
import { karateBenefits } from "@/content/home";
import { photos } from "@/content/media";
import { karatePage } from "@/content/pages";
import { whatsappMessages } from "@/content/whatsapp";
import { Accordion } from "@/components/ui/Accordion";
import { ButtonLink, TextLink } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/Chip";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { WhatsAppIcon } from "@/components/site/icons";
import { ScrollProgress } from "@/components/site/ScrollProgress";
import { SectionShell } from "@/components/site/SectionShell";
import { EndBand } from "@/components/sections/shared/EndBand";
import { PageHero } from "@/components/sections/shared/PageHero";
import { JsonLd, faqJsonLd, serviceJsonLd } from "@/lib/seo";
import { getSettings } from "@/lib/data/public";
import { whatsappHref } from "@/lib/phone";

export const metadata: Metadata = {
  title: "Kenpo Karate for schools",
  description:
    "A structured martial arts programme for learners, led by a 3rd-degree black belt. Request a demonstration at your school.",
  alternates: { canonical: "/programmes/kenpo-karate" },
};

export default async function KenpoKaratePage() {
  const settings = await getSettings();
  const wa = whatsappHref(settings.whatsappE164, whatsappMessages.karate);
  const faqs = karatePage.showGradingFaq ? [...karatePage.faqs, karatePage.gradingFaq] : karatePage.faqs;

  return (
    <>
      <ScrollProgress />
      <JsonLd data={[serviceJsonLd("Kenpo Karate", "/programmes/kenpo-karate", settings.counties), faqJsonLd(faqs)]} />
      <PageHero
        theme="dark"
        eyebrow={<StatusChip status="available" />}
        title={karatePage.h1}
        sub={karatePage.sub}
        aside={
          <PhotoSlot
            photo={photos["kennedy-action-2"]}
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="aspect-[4/5] w-full"
          />
        }
      >
        <ButtonLink href={karatePage.primary.href} cta={karatePage.primary.cta} size="lg" magnetic>
          {karatePage.primary.label}
        </ButtonLink>
        <ButtonLink href={wa} cta="karate-whatsapp" variant="secondary" size="lg">
          <WhatsAppIcon size={20} />
          {karatePage.whatsappLabel}
        </ButtonLink>
      </PageHero>

      <SectionShell theme="light" aria-labelledby="gain-title">
        <div className="container-site">
          <h2 id="gain-title" className="type-display-l">
            {karatePage.gainTitle}
          </h2>
          <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            {karateBenefits.map((b, i) => (
              <li
                key={b.title}
                data-reveal
                style={{ "--i": i } as React.CSSProperties}
                className="rounded-[24px] border border-hairline bg-surface p-6"
              >
                <span className="type-small font-semibold text-accent-text tabular">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-[19px] font-semibold">{b.title}</h3>
                <p className="mt-2 text-fg-2">{b.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </SectionShell>

      <SectionShell theme="tint" aria-labelledby="who-title">
        <div className="container-site grid gap-12 lg:grid-cols-2">
          <div>
            <h2 id="who-title" className="type-h3">
              {karatePage.whoTitle}
            </h2>
            <p className="type-lead mt-4">{karatePage.who}</p>
            <h2 className="mt-12 type-h3">{karatePage.safetyTitle}</h2>
            <p className="mt-4 flex gap-4 text-text-2">
              <ShieldCheck aria-hidden="true" size={24} strokeWidth={1.5} className="shrink-0 text-green-700" />
              {karatePage.safety}
            </p>
          </div>
          <div>
            <h2 className="type-h3">{karatePage.looksTitle}</h2>
            <ul className="mt-4 divide-y divide-hairline rounded-[24px] bg-paper px-6">
              {karatePage.looks.map((line) => (
                <li key={line} className="flex items-start gap-3 py-4">
                  <Check aria-hidden="true" size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-green-700" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionShell>

      <SectionShell theme="dark" aria-labelledby="led-title">
        <div className="container-site grid gap-10 lg:grid-cols-12 lg:items-center">
          <PhotoSlot
            photo={photos["kennedy-portrait"]}
            sizes="(min-width: 1024px) 30vw, 100vw"
            className="aspect-[4/5] w-full max-w-[420px] lg:col-span-4"
          />
          <div className="lg:col-span-6 lg:col-start-6">
            <h2 id="led-title" className="type-display-l">
              {karatePage.ledByTitle}
            </h2>
            <p className="type-lead mt-6 text-fg-2">{karatePage.ledBy}</p>
            <TextLink href={karatePage.ledByLink.href} cta={karatePage.ledByLink.cta} className="mt-6">
              {karatePage.ledByLink.label}
            </TextLink>
          </div>
        </div>
      </SectionShell>

      <SectionShell theme="light" aria-labelledby="faq-title">
        <div className="container-text">
          <h2 id="faq-title" className="type-display-l mb-10">
            {karatePage.faqTitle}
          </h2>
          <Accordion items={faqs} />
        </div>
      </SectionShell>

      <EndBand title={karatePage.endBand}>
        <ButtonLink href={karatePage.primary.href} cta={karatePage.primary.cta} size="lg" magnetic>
          {karatePage.primary.label}
        </ButtonLink>
        <ButtonLink href={wa} cta="karate-whatsapp" variant="secondary" size="lg">
          <WhatsAppIcon size={20} />
          {karatePage.whatsappLabel}
        </ButtonLink>
      </EndBand>
    </>
  );
}
