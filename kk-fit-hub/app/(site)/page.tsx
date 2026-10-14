import { expect, process, standard } from "@/content/home";
import { ButtonLink, TextLink } from "@/components/ui/Button";
import { SectionShell } from "@/components/site/SectionShell";
import { Flagship } from "@/components/sections/home/Flagship";
import { Founder } from "@/components/sections/home/Founder";
import { Hero } from "@/components/sections/home/Hero";
import { Hub } from "@/components/sections/home/Hub";
import { Manifesto } from "@/components/sections/home/Manifesto";
import { Pathway } from "@/components/sections/home/Pathway";
import { Testimonials } from "@/components/sections/home/Testimonials";
import { TwoDoors } from "@/components/sections/home/TwoDoors";
import { WhereWeWork } from "@/components/sections/home/WhereWeWork";
import { WhyNow } from "@/components/sections/home/WhyNow";
import { Belt } from "@/components/sections/shared/Belt";
import { ExpectCards } from "@/components/sections/shared/ExpectCards";
import { ProcessSteps } from "@/components/sections/shared/ProcessSteps";
import { getActivities, getPartners, getSettings, getTestimonials } from "@/lib/data/public";
import { JsonLd, serviceJsonLd } from "@/lib/seo";

/** Home: 12 sections alternating dark and light (PRD 6). */
export const metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [activities, settings, testimonials, partners] = await Promise.all([
    getActivities(),
    getSettings(),
    getTestimonials(),
    getPartners(),
  ]);

  return (
    <>
      <JsonLd data={serviceJsonLd("Kenpo Karate", "/programmes/kenpo-karate", settings.counties)} />
      <Hero counties={settings.counties} />
      <Manifesto />
      <Flagship />
      <Hub activities={activities} />
      <WhyNow />

      {/* 6.6 How it works */}
      <SectionShell theme="light" aria-labelledby="process-title">
        <div className="container-site">
          <h2 id="process-title" className="type-display-l max-w-[14ch]">
            {process.h2}
          </h2>
          <div className="mt-12 lg:mt-16">
            <ProcessSteps steps={process.steps} />
          </div>
          <ButtonLink href={process.cta.href} cta={process.cta.cta} magnetic className="mt-12 w-full sm:w-auto">
            {process.cta.label}
          </ButtonLink>
        </div>
      </SectionShell>

      {/* 6.7 Our standard */}
      <SectionShell theme="dark" aria-labelledby="standard-title" id="standard">
        <div className="container-site">
          <div className="max-w-[760px]">
            <h2 id="standard-title" className="type-display-l">
              {standard.h2}
            </h2>
            <p className="type-lead mt-6 text-fg-2">{standard.lead}</p>
          </div>
          <div className="mt-12 lg:mt-16">
            <Belt stages={standard.stages} />
          </div>
          <p className="mt-12 type-h3">{standard.closing}</p>
          <TextLink href={standard.link.href} cta={standard.link.cta} className="mt-4">
            {standard.link.label}
          </TextLink>
        </div>
      </SectionShell>

      {/* 6.8 What schools can expect */}
      <SectionShell theme="light" aria-labelledby="expect-title">
        <div className="container-site">
          <h2 id="expect-title" className="type-display-l max-w-[16ch]">
            {expect.h2}
          </h2>
          <div className="mt-12">
            <ExpectCards cards={expect.cards} />
          </div>
        </div>
      </SectionShell>

      <Testimonials items={testimonials} />
      <Founder partners={partners} />
      <Pathway />
      <WhereWeWork counties={settings.counties} />
      <TwoDoors />
    </>
  );
}
