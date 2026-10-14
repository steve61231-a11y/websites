import { flagship, karateBenefits } from "@/content/home";
import { flagshipPhoto } from "@/content/media";
import { ButtonLink, TextLink } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/Chip";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { SectionShell } from "@/components/site/SectionShell";
import { MotionSlot } from "@/motion/MotionSlot";

/** 6.3 Flagship: Kenpo Karate, the programme available today. */
export function Flagship() {
  const photo = flagshipPhoto();
  return (
    <SectionShell theme="dark" aria-labelledby="flagship-title">
      <div className="container-site">
        <div className="max-w-[760px]">
          <StatusChip status="available" />
          <h2 id="flagship-title" className="type-display-l mt-5">
            {flagship.h2}
          </h2>
          <p className="type-lead mt-6 text-fg-2">{flagship.lead}</p>
        </div>

        <MotionSlot id="flagship-sticky" className="mt-12 lg:mt-20 lg:grid lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[calc(var(--header-h)+48px)]">
              <PhotoSlot photo={photo} sizes="(min-width: 1024px) 40vw, 100vw" className="aspect-[4/5] w-full" />
              <p data-flagship-counter hidden className="mt-4 type-small text-fg-2 tabular">
                <span data-flagship-index>01</span> / 05
              </p>
            </div>
          </div>
          <ol className="mt-10 lg:col-span-6 lg:col-start-7 lg:mt-0">
            {karateBenefits.map((b, i) => (
              <li
                key={b.title}
                data-reveal
                data-benefit={i}
                style={{ "--i": i } as React.CSSProperties}
                className="flex gap-5 border-t border-hairline py-8 first:border-t-0 lg:min-h-[60vh] lg:flex-col lg:justify-center lg:gap-4 lg:border-t-0 lg:py-0"
              >
                <span className="type-small font-semibold text-green-500 tabular">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="type-h3">{b.title}</h3>
                  <p className="mt-2 text-fg-2 lg:type-lead">{b.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </MotionSlot>

        <div className="mt-12 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-6 lg:mt-16">
          <ButtonLink href={flagship.primary.href} cta={flagship.primary.cta} magnetic>
            {flagship.primary.label}
          </ButtonLink>
          <TextLink href={flagship.secondary.href} cta={flagship.secondary.cta} className="justify-center sm:justify-start">
            {flagship.secondary.label}
          </TextLink>
        </div>
      </div>
    </SectionShell>
  );
}
