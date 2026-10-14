import type { Metadata } from "next";
import { expect, standard } from "@/content/home";
import { photos } from "@/content/media";
import { schoolsPage } from "@/content/pages";
import { joinList } from "@/content/site";
import { whatsappMessages } from "@/content/whatsapp";
import { Accordion } from "@/components/ui/Accordion";
import { ButtonLink } from "@/components/ui/Button";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { WhatsAppIcon } from "@/components/site/icons";
import { ScrollProgress } from "@/components/site/ScrollProgress";
import { SectionShell } from "@/components/site/SectionShell";
import { Belt } from "@/components/sections/shared/Belt";
import { EndBand } from "@/components/sections/shared/EndBand";
import { ExpectCards } from "@/components/sections/shared/ExpectCards";
import { PageHero } from "@/components/sections/shared/PageHero";
import { ProcessSteps } from "@/components/sections/shared/ProcessSteps";
import { getSettings } from "@/lib/data/public";
import { whatsappHref } from "@/lib/phone";
import { JsonLd, faqJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "For schools",
  description:
    "How KK Fit Hub plans, staffs and runs co-curricular programmes inside your school, and how every coach is vetted.",
  alternates: { canonical: "/schools" },
};

/** 7.4 For Schools. */
export default async function SchoolsPage() {
  const settings = await getSettings();
  const wa = whatsappHref(settings.whatsappE164, whatsappMessages.general);
  const faqs = schoolsPage.faqs(joinList(settings.counties));

  return (
    <>
      <ScrollProgress />
      <JsonLd data={faqJsonLd(faqs)} />
      <PageHero
        title={schoolsPage.h1}
        sub={schoolsPage.sub}
        aside={
          <PhotoSlot
            photo={photos["class-wide"].src ? photos["class-wide"] : photos["kennedy-teaching"]}
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="aspect-[4/3] w-full"
          />
        }
      >
        <ButtonLink href={schoolsPage.primary.href} cta={schoolsPage.primary.cta} size="lg" magnetic>
          {schoolsPage.primary.label}
        </ButtonLink>
        <ButtonLink href={wa} cta="schools-whatsapp" variant="secondary" size="lg">
          <WhatsAppIcon size={20} />
          {schoolsPage.whatsappLabel}
        </ButtonLink>
      </PageHero>

      <SectionShell theme="light" id="how-it-works" aria-labelledby="how-title" className="pt-0!">
        <div className="container-site">
          <h2 id="how-title" className="type-display-l">
            {schoolsPage.howTitle}
          </h2>
          <div className="mt-12 lg:mt-16">
            <ProcessSteps steps={schoolsPage.steps} />
          </div>
        </div>
      </SectionShell>

      <SectionShell theme="dark" id="standard" aria-labelledby="standard-title">
        <div className="container-site">
          <p className="type-eyebrow mb-4">{schoolsPage.standardTitle}</p>
          <h2 id="standard-title" className="type-display-l max-w-[16ch]">
            {standard.h2}
          </h2>
          <p className="type-lead mt-6 max-w-[40ch] text-fg-2">{standard.lead}</p>
          <div className="mt-12 lg:mt-16">
            <Belt stages={standard.stages} />
          </div>
          <p className="mt-12 type-h3">{standard.closing}</p>
        </div>
      </SectionShell>

      <SectionShell theme="light" aria-labelledby="expect-title">
        <div className="container-site">
          <p className="type-eyebrow mb-4">{schoolsPage.expectTitle}</p>
          <h2 id="expect-title" className="type-display-l max-w-[16ch]">
            {expect.h2}
          </h2>
          <div className="mt-12">
            <ExpectCards cards={expect.cards} />
          </div>
        </div>
      </SectionShell>

      <SectionShell theme="light" aria-labelledby="faq-title" className="pt-0!">
        <div className="container-text">
          <h2 id="faq-title" className="type-display-l mb-10">
            {schoolsPage.faqTitle}
          </h2>
          <Accordion items={faqs} />
        </div>
      </SectionShell>

      <EndBand title={schoolsPage.endBand}>
        <ButtonLink href={schoolsPage.primary.href} cta={schoolsPage.primary.cta} size="lg" magnetic>
          {schoolsPage.primary.label}
        </ButtonLink>
        <ButtonLink href={wa} cta="schools-whatsapp" variant="secondary" size="lg">
          <WhatsAppIcon size={20} />
          {schoolsPage.whatsappLabel}
        </ButtonLink>
      </EndBand>
    </>
  );
}
