import type { Testimonial } from "@/lib/data/public";
import { SectionShell } from "@/components/site/SectionShell";

/** Renders only when at least 2 testimonials are published with permission (PRD 6). */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length < 2) return null;
  return (
    <SectionShell theme="light" aria-labelledby="testimonials-title">
      <div className="container-site">
        <h2 id="testimonials-title" className="sr-only">
          Testimonials
        </h2>
        <ul className="grid gap-4 md:grid-cols-2 lg:gap-6">
          {items.map((t, i) => (
            <li
              key={t.id}
              data-reveal
              style={{ "--i": i } as React.CSSProperties}
              className="rounded-[24px] border border-hairline bg-surface p-6 lg:p-8"
            >
              <figure>
                <blockquote className="text-[19px] leading-snug">
                  <p>“{t.quote}”</p>
                </blockquote>
                <figcaption className="mt-6 type-small text-fg-2">
                  <span className="font-semibold text-fg">{t.authorName}</span>
                  {[t.authorRole, t.organisation].filter(Boolean).length > 0 &&
                    `, ${[t.authorRole, t.organisation].filter(Boolean).join(", ")}`}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  );
}
