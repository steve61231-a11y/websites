import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Certificate } from "@/components/certificate";
import { Curriculum } from "@/components/curriculum";
import { EnrollButton } from "@/components/enroll-button";
import { LensArt } from "@/components/lens-art";
import { Footer, SiteNav } from "@/components/nav";
import { Reveal } from "@/components/reveal";
import { courses, courseStats, formatDuration, formatPrice, getCourse } from "@/lib/catalog";

export function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const course = getCourse((await props.params).slug);
  return { title: course?.title ?? "Course", description: course?.description };
}

export default async function CoursePage(props: PageProps<"/courses/[slug]">) {
  const course = getCourse((await props.params).slug);
  if (!course) notFound();
  const stats = courseStats(course);

  return (
    <>
      <SiteNav tone="dark" />
      {/* Product sub-nav */}
      <div className="sticky top-12 z-40 border-b border-black/[0.06] bg-[rgba(251,251,253,0.8)] backdrop-blur-xl">
        <div className="wrap flex h-[52px] items-center justify-between">
          <p className="text-[17px] font-semibold tracking-[-0.02em] sm:text-[21px]">{course.shortTitle}</p>
          <div className="flex items-center gap-4">
            <span className="hidden text-[13px] text-muted sm:block">{formatPrice(course.price, course.currency)}</span>
            <EnrollButton course={course} size="sm" />
          </div>
        </div>
      </div>

      <main>
        {/* Hero */}
        <section className="overflow-hidden bg-night text-night-ink">
          <div className="wrap grid items-center gap-10 pb-20 pt-16 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-24">
            <Reveal>
              <p className="text-[15px] font-semibold text-[#f5a623]">{course.level}</p>
              <h1 className="display mt-3 text-[clamp(40px,6.5vw,72px)]">{course.title}</h1>
              <p className="mt-5 max-w-[30ch] text-[clamp(19px,2.2vw,23px)] leading-snug text-white/70">{course.description}</p>
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <EnrollButton course={course} size="lg" />
                <a href="#curriculum" className="text-[17px] text-[#2997ff] hover:underline underline-offset-4">
                  See the curriculum ›
                </a>
              </div>
            </Reveal>
            <div className="relative mx-auto w-full max-w-[440px]">
              <div className="absolute inset-[-20%] bg-[radial-gradient(circle,rgba(245,166,35,0.18),transparent_60%)] blur-2xl" />
              <LensArt className="relative w-full" hue={28} aperture={0.9} />
            </div>
          </div>
        </section>

        {/* At a glance */}
        <section className="border-b border-line bg-white">
          <dl className="wrap grid grid-cols-2 gap-y-6 py-10 sm:grid-cols-4">
            {[
              [`${stats.modules}`, "Modules"],
              [`${stats.lessons}`, "Video lessons"],
              [formatDuration(stats.seconds), "Total runtime"],
              ["Lifetime", "Access"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="text-[13px] text-muted">{l}</dt>
                <dd className="mt-1 text-[24px] font-semibold tracking-[-0.02em]">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Outcomes */}
        <section className="wrap py-24 sm:py-32">
          <Reveal>
            <h2 className="display max-w-[14ch] text-[clamp(32px,5vw,56px)]">What you&apos;ll walk away with.</h2>
          </Reveal>
          <div className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2">
            {course.outcomes.map((o, i) => (
              <Reveal key={o.title} delay={i * 0.06}>
                <div className="border-t border-line pt-6">
                  <h3 className="text-[24px] font-semibold tracking-[-0.02em]">{o.title}</h3>
                  <p className="mt-2 text-[17px] leading-relaxed text-muted">{o.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Curriculum */}
        <section id="curriculum" className="scroll-mt-28 bg-white py-24 sm:py-32">
          <div className="wrap">
            <Reveal>
              <p className="eyebrow">Curriculum</p>
              <h2 className="display mt-2 text-[clamp(32px,5vw,56px)]">Seven modules. One clear path.</h2>
              <p className="mt-4 max-w-xl text-[19px] leading-relaxed text-muted">
                Each module ends with a short quiz. Pass it, and the next module unlocks.
              </p>
            </Reveal>
            <div className="mt-12">
              <Curriculum modules={course.modules} />
            </div>
          </div>
        </section>

        {/* Instructor */}
        <section className="wrap py-24 sm:py-32">
          <Reveal>
            <div className="grid items-center gap-10 sm:grid-cols-[auto_1fr]">
              <div className="grid size-36 place-items-center rounded-full bg-gradient-to-br from-[#2c2c2e] to-black text-[44px] font-semibold tracking-tight text-white sm:size-44">
                {course.instructor.initials}
              </div>
              <div>
                <p className="eyebrow">Your instructor</p>
                <h2 className="mt-1 text-[36px] font-semibold tracking-[-0.03em]">{course.instructor.name}</h2>
                <p className="text-[17px] text-muted">{course.instructor.title}</p>
                <p className="mt-5 max-w-2xl text-[19px] leading-relaxed text-ink-2">{course.instructor.bio}</p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Certificate */}
        <section className="overflow-hidden bg-[#f5f5f7] py-24 sm:py-32">
          <div className="wrap text-center">
            <Reveal>
              <h2 className="display text-[clamp(32px,5vw,56px)]">Earn it. Keep it.</h2>
              <p className="mx-auto mt-4 max-w-xl text-[19px] leading-relaxed text-muted">
                Pass the final assessment and your certificate is issued instantly, emailed to you, and verifiable by anyone.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mx-auto mt-14 max-w-3xl shadow-[0_40px_80px_-24px_rgba(0,0,0,0.25)]">
                <Certificate name="Your Name" course={course.title} />
              </div>
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="wrap py-24 text-center sm:py-32">
          <Reveal>
            <h2 className="display text-[clamp(32px,5vw,56px)]">Start today.</h2>
            <p className="mt-3 text-[clamp(28px,4vw,40px)] font-semibold tracking-tight text-muted">
              {formatPrice(course.price, course.currency)}
            </p>
            <p className="mt-2 text-[15px] text-muted">One payment. Lifetime access. No subscription.</p>
            <div className="mt-8 flex justify-center">
              <EnrollButton course={course} size="lg" label="Enroll now" />
            </div>
            <p className="mt-5 text-[13px] text-faint">Card and M-Pesa via Paystack · Access in seconds</p>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
