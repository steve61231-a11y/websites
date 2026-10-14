import { founder } from "@/content/home";
import { photos } from "@/content/media";
import type { Partner } from "@/lib/data/public";
import { TextLink } from "@/components/ui/Button";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { Eyebrow, SectionShell } from "@/components/site/SectionShell";
import { CountUp } from "@/motion/CountUp";
import { MotionSlot } from "@/motion/MotionSlot";

/** 6.9 Founder: Kennedy is the proof. Partners strip only when published with permission. */
export function Founder({ partners }: { partners: Partner[] }) {
  return (
    <SectionShell theme="dark" aria-labelledby="founder-title">
      <MotionSlot id="founder-counters" className="container-site grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <PhotoSlot
            photo={photos["kennedy-portrait"]}
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="aspect-[4/5] w-full"
          />
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <Eyebrow>{founder.kicker}</Eyebrow>
          <h2 id="founder-title" className="type-display-l">
            {founder.h2}
          </h2>
          <p className="mt-6 text-fg-2 lg:type-lead">{founder.body}</p>
          <figure className="mt-8 border-l-2 border-green-500 pl-6">
            <blockquote className="text-[19px] leading-snug font-medium lg:text-[22px]">
              <p>“{founder.quote}”</p>
            </blockquote>
            <figcaption className="mt-3 type-small text-fg-2">{founder.quoteBy}</figcaption>
          </figure>
          <dl className="mt-10 grid grid-cols-3 gap-4">
            {founder.counters.map((c) => (
              <div key={c.label} className="flex flex-col-reverse">
                <dt className="mt-2 type-small text-fg-2">{c.label}</dt>
                <dd className="text-[clamp(40px,8vw,96px)] leading-none font-bold tracking-[-0.04em]">
                  <CountUp value={c.value} suffix={c.suffix} />
                </dd>
              </div>
            ))}
          </dl>
          <TextLink href={founder.link.href} cta={founder.link.cta} className="mt-8">
            {founder.link.label}
          </TextLink>
        </div>
      </MotionSlot>

      {partners.length > 0 && (
        <div className="container-site mt-16 border-t border-hairline pt-10">
          <h3 className="type-small font-semibold text-fg-2">{founder.partnersTitle}</h3>
          <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-[19px] font-semibold">
            {partners.map((p) => (
              <li key={p.id}>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:text-green-300">
                    {p.name}
                  </a>
                ) : (
                  p.name
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionShell>
  );
}
