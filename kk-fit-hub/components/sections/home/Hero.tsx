import type { CSSProperties } from "react";
import { hero } from "@/content/home";
import { photos } from "@/content/media";
import { ButtonLink, TextLink } from "@/components/ui/Button";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { SectionShell } from "@/components/site/SectionShell";
import { MotionSlot } from "@/motion/MotionSlot";

const strike = photos["kennedy-strike"];

/** 6.1 Hero, "The Strike". Dark stage; Kennedy's cutout reaches toward the text. */
export function Hero({ counties }: { counties: string[] }) {
  // CONFIRM: counties ("Nairobi and 5 more counties").
  const proof = [hero.proof[0], hero.proof[1], `${counties[0]} and ${counties.length - 1} more counties`];
  const sp = strike.strikePoint;
  const vars = {
    "--strike-x-m": `${sp?.mobile.x ?? 50}%`,
    "--strike-y-m": `${sp?.mobile.y ?? 40}%`,
    "--strike-x-d": `${sp?.desktop.x ?? 20}%`,
    "--strike-y-d": `${sp?.desktop.y ?? 40}%`,
  } as CSSProperties;

  return (
    <SectionShell theme="dark" pad={false} className="bg-stage-glow grain overflow-hidden" aria-labelledby="hero-title">
      <MotionSlot id="hero-strike" className="hero relative min-h-[max(640px,100svh)]" style={vars}>
        {/* Decorative backdrop word, behind Kennedy; never overlaps the H1's legibility. */}
        <div
          aria-hidden="true"
          data-hero-word
          className="pointer-events-none absolute inset-x-0 top-[18%] text-center text-[22vw] leading-none font-bold tracking-[-0.04em] text-canvas opacity-[0.06] select-none lg:top-auto lg:bottom-[6%] lg:left-[27%] lg:text-left"
        >
          {hero.backdropWord}
        </div>

        {/* Photo: mobile fills the top 58%, desktop sits in columns 6–12 anchored to the bottom. */}
        <div
          data-hero-photo
          className="settle-in absolute inset-x-0 top-0 h-[58svh] min-h-[372px] lg:inset-y-0 lg:right-[max(0px,calc((100vw-1296px)/2))] lg:left-auto lg:h-auto lg:w-[min(58vw,760px)]"
        >
          <div className="bg-impact-glow hero-impact pointer-events-none absolute inset-0" aria-hidden="true" />
          <PhotoSlot
            photo={strike}
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            rounded={false}
            className="absolute inset-0 bg-transparent! lg:inset-x-0 lg:top-[10%] lg:bottom-0"
            imgClassName="object-contain object-bottom"
          />
          {/* Fade the photo into the stage (mobile). */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent,var(--ink-900))] lg:hidden"
          />
        </div>

        <div className="relative container-site flex min-h-[max(640px,100svh)] flex-col justify-end pt-[52svh] pb-16 lg:grid lg:grid-cols-12 lg:items-center lg:pt-(--header-h) lg:pb-0">
          <div className="lg:col-span-6 lg:col-start-1">
            <p className="type-eyebrow rise-in" style={{ "--i": 0 } as CSSProperties}>
              {hero.eyebrow}
            </p>
            <h1 id="hero-title" className="type-display-xl rise-in-solid mt-4" style={{ "--i": 1 } as CSSProperties}>
              {hero.h1}
            </h1>
            <p className="type-lead rise-in-solid measure mt-6 text-fg-2" style={{ "--i": 2 } as CSSProperties}>
              {hero.sub}
            </p>
            <div
              className="rise-in mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-6"
              style={{ "--i": 3 } as CSSProperties}
            >
              <ButtonLink href={hero.primary.href} cta={hero.primary.cta} size="lg" magnetic>
                {hero.primary.label}
              </ButtonLink>
              <TextLink href={hero.secondary.href} cta={hero.secondary.cta} className="justify-center sm:justify-start">
                {hero.secondary.label}
              </TextLink>
            </div>
            <p className="rise-in mt-8 type-small text-fg-2" style={{ "--i": 4 } as CSSProperties}>
              {proof.join(" · ")}
            </p>
          </div>
        </div>
      </MotionSlot>
    </SectionShell>
  );
}
