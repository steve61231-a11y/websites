"use client";

import { FadeIn } from "@/components/motion/reveal";
import { Star } from "@/components/icons";
import { testimonials, trustedCompanies } from "@/lib/content/social-proof";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** A quiet row of the companies and people who trust us. */
export function TrustedBy() {
  return (
    <section aria-label="Trusted by" className="bg-black pb-4 pt-16 sm:pt-20">
      <div className="wrap">
        <p className="text-center text-[12px] font-semibold uppercase tracking-[0.22em] text-faint">Trusted by</p>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {trustedCompanies.map((c, i) => (
            <li
              key={i}
              className={`grid h-14 place-items-center rounded-2xl px-4 text-[14px] font-semibold tracking-[-0.01em] ring-1 ring-inset ${
                c.placeholder ? "border border-dashed border-line-2 text-faint ring-transparent" : "bg-surface text-muted ring-white/[0.06]"
              }`}
            >
              {c.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.logo} alt={c.name} className="max-h-7 w-auto opacity-70 grayscale" />
              ) : (
                c.name
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** What students say. Replaces any outline of the course: proof, not a syllabus. */
export function Testimonials({ id = "reviews" }: { id?: string }) {
  return (
    <section id={id} className="relative scroll-mt-24 bg-black py-24 sm:py-32">
      <div className="wrap">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Student results</p>
          <h2 className="headline mt-4 text-[clamp(30px,4.4vw,52px)] text-white">What students say</h2>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-[28px] bg-surface p-7 ring-1 ring-inset ring-white/[0.06] sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="flex gap-0.5 text-amber" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }, (_, n) => (
                      <Star key={n} size={17} fill="currentColor" strokeWidth={1.2} />
                    ))}
                  </span>
                  {t.placeholder && (
                    <span className="rounded-full border border-dashed border-line-2 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">Placeholder</span>
                  )}
                </div>
                <blockquote className="mt-6 flex-1 text-[17px] leading-relaxed text-ink-2">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-8 flex items-center gap-3">
                  {t.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.photo} alt="" className="size-11 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-11 place-items-center rounded-full bg-white/[0.08] font-[family-name:var(--font-display)] text-[13px] font-bold text-white">{initials(t.name)}</span>
                  )}
                  <div className="text-[14px] leading-tight">
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="mt-0.5 text-muted">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
