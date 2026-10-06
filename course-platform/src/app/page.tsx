import Link from "next/link";
import { ComingSoonCard, CourseCard } from "@/components/course-cards";
import { LensArt } from "@/components/lens-art";
import { Footer, SiteNav } from "@/components/nav";
import { Reveal } from "@/components/reveal";
import { CertificateMini } from "@/components/certificate";
import { comingSoon, courses, courseStats, formatPrice, photographyCourse } from "@/lib/catalog";

const steps = [
  { n: "01", title: "Enroll.", body: "Pay securely with card or M-Pesa. Access arrives in your inbox in seconds." },
  { n: "02", title: "Learn.", body: "Short, focused lessons that fit around your day, on any screen." },
  { n: "03", title: "Prove it.", body: "A quick quiz after each module unlocks the next one." },
  { n: "04", title: "Get certified.", body: "Finish and receive a verifiable certificate with your name on it." },
];

export default function Home() {
  const course = photographyCourse;
  const stats = courseStats(course);

  return (
    <>
      <SiteNav />
      <main>
        {/* Hero */}
        <section className="wrap pb-20 pt-20 text-center sm:pb-28 sm:pt-32">
          <Reveal>
            <h1 className="display mx-auto max-w-[12ch] text-[clamp(44px,9vw,96px)]">Learn something worth knowing.</h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-[34ch] text-[clamp(19px,2.4vw,24px)] leading-snug text-muted">
              Practical courses from people who do the work. Learn at your pace. Finish with a certificate.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/courses" className="btn btn-primary btn-lg">Explore courses</Link>
              <Link href="/login" className="link text-[17px]">Already enrolled? Log in ›</Link>
            </div>
          </Reveal>
        </section>

        {/* Featured course: product-launch style */}
        <section className="bg-night text-night-ink">
          <div className="wrap flex flex-col items-center pb-16 pt-20 text-center sm:pt-28">
            <Reveal>
              <p className="text-[15px] font-semibold text-[#f5a623]">Now enrolling</p>
              <h2 className="display mt-2 text-[clamp(36px,6.5vw,72px)]">{course.shortTitle}</h2>
              <p className="mt-3 text-[clamp(19px,2.6vw,28px)] text-white/70">{course.tagline}</p>
              <div className="mt-8 flex items-center justify-center gap-5">
                <Link href={`/courses/${course.slug}`} className="btn btn-primary">Learn more</Link>
                <Link href={`/checkout/${course.slug}`} className="text-[17px] text-[#2997ff] hover:underline underline-offset-4">
                  Enroll ›
                </Link>
              </div>
            </Reveal>
            <div className="relative mt-14 w-full max-w-[520px]">
              <div className="absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,rgba(41,151,255,0.28),transparent_62%)] blur-2xl" />
              <LensArt className="relative w-full drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)]" />
            </div>
            <dl className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-y-8 border-t border-white/10 pt-10 sm:grid-cols-4">
              {[
                [String(stats.modules), "modules"],
                [String(stats.lessons), "lessons"],
                [`${(stats.seconds / 3600).toFixed(1)} hrs`, "of video"],
                ["1", "certificate"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-[clamp(28px,4vw,40px)] font-semibold tracking-tight">{v}</dt>
                  <dd className="text-[14px] text-white/55">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Collection */}
        <section className="wrap py-24 sm:py-32">
          <Reveal>
            <h2 className="display text-[clamp(32px,5vw,56px)]">The collection.</h2>
            <p className="mt-3 max-w-xl text-[19px] text-muted">
              One course today. More, from more instructors, on the way.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr]">
            {courses.map((c) => (
              <Reveal key={c.id}>
                <CourseCard course={c} />
              </Reveal>
            ))}
            {comingSoon.slice(0, 2).map((c, i) => (
              <Reveal key={c.id} delay={0.08 * (i + 1)}>
                <ComingSoonCard item={c} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-12 bg-white py-24 sm:py-32">
          <div className="wrap">
            <Reveal>
              <p className="eyebrow">How it works</p>
              <h2 className="display mt-2 max-w-[16ch] text-[clamp(32px,5vw,56px)]">
                From first lesson to certificate, without the guesswork.
              </h2>
            </Reveal>
            <ol className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <Reveal key={s.n} delay={i * 0.08}>
                  <li className="border-t border-ink pt-5">
                    <p className="text-[13px] font-medium tabular-nums text-faint">{s.n}</p>
                    <h3 className="mt-6 text-[28px] font-semibold tracking-[-0.025em]">{s.title}</h3>
                    <p className="mt-2 text-[16px] leading-relaxed text-muted">{s.body}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Certificate teaser */}
        <section className="overflow-hidden py-24 sm:py-32">
          <div className="wrap grid items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <h2 className="display text-[clamp(32px,5vw,56px)]">Finish strong.</h2>
              <p className="mt-4 max-w-md text-[19px] leading-relaxed text-muted">
                Every certificate carries your name, a unique ID and a public verification page, so anyone can confirm it&apos;s real.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Link href={`/checkout/${course.slug}`} className="btn btn-dark">
                  Enroll for {formatPrice(course.price, course.currency)}
                </Link>
                <Link href="/verify" className="link text-[17px]">Verify a certificate ›</Link>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="[perspective:1600px]">
                <div className="[transform:rotateX(8deg)_rotateY(-14deg)_rotate(2deg)] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)]">
                  <CertificateMini name="Your Name" course={course.title} />
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
