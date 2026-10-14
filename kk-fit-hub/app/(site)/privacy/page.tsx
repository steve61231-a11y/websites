import type { Metadata } from "next";
import Link from "next/link";
import { PRIVACY_LAST_UPDATED as LAST_UPDATED, PRIVACY_VERSION } from "@/content/legal";
import { brand, joinList } from "@/content/site";
import { SectionShell } from "@/components/site/SectionShell";
import { getSettings } from "@/lib/data/public";
import { formatLocalPhone, telHref } from "@/lib/phone";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How KK Fit Hub collects, uses and protects personal data under the Kenya Data Protection Act 2019.",
  alternates: { canonical: "/privacy" },
};


/**
 * 7.8 Privacy notice. DRAFT for legal review before launch.
 * CONFIRM: retention periods with a lawyer; whether ODPC registration is required.
 */
export default async function PrivacyPage() {
  const settings = await getSettings();
  const phone = settings.phones[0];

  return (
    <SectionShell
      theme="light"
      pad={false}
      className="pt-[calc(var(--header-h)+64px)] pb-24 lg:pt-[calc(var(--header-h)+112px)] lg:pb-40"
    >
      <article className="container-text">
        <h1 className="type-display-l">Privacy notice</h1>
        <p className="mt-4 text-fg-2">Last updated {LAST_UPDATED}</p>

        <div className="measure mt-12 space-y-10 [&_h2]:type-h3 [&_li]:mt-2 [&_p]:mt-3 [&_p]:text-fg-2 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-fg-2">
          <section>
            <h2>Who we are</h2>
            <p>
              {brand.name} runs co-curricular programmes in Kenyan schools. We decide how and why the personal data
              described here is used, so we are its data controller under the Kenya Data Protection Act 2019.
            </p>
          </section>

          <section>
            <h2>What we collect</h2>
            <ul>
              <li>
                <strong>School requests and messages:</strong> your name, role, school or organisation, county, phone
                number, email if you give it, the activities you are interested in, and anything you choose to tell us
                about your school, timetable and learners in general terms.
              </li>
              <li>
                <strong>Coach applications:</strong> your contact details, county, experience, qualifications,
                availability, referees you name, and documents you upload, such as certificates, a first aid
                certificate or a Certificate of Good Conduct.
              </li>
              <li>
                <strong>Website use:</strong> privacy-friendly, cookieless statistics such as which pages are visited
                and which buttons are used. These contain no names, phone numbers or emails.
              </li>
            </ul>
            <p>We do not collect information about individual learners through this website.</p>
          </section>

          <section>
            <h2>Why we use it, and our legal basis</h2>
            <ul>
              <li>
                To respond to your request, arrange a demonstration and propose a programme. Basis: your consent, and
                steps you ask us to take before a contract.
              </li>
              <li>
                To assess coach applications, including interviews, live demonstrations and checks with the referees
                and authorities you name. Basis: your consent, and steps before a contract of employment.
              </li>
              <li>
                To run and improve our service and keep records of what we have agreed. Basis: our legitimate interest
                and, once agreed, the contract.
              </li>
            </ul>
          </section>

          <section>
            <h2>Who can see it</h2>
            <p>
              Only {brand.name} staff who need it. We use a small number of service providers to run the website and
              store data on our behalf: website hosting (Vercel), our database and file storage (Supabase) and, once
              enabled, email delivery (Resend). They process data only on our instructions. We never sell your data.
            </p>
          </section>

          <section>
            <h2>Where it is stored</h2>
            <p>
              Our hosting and database providers store data outside Kenya. We choose the region closest to Nairobi and
              rely on our providers&apos; contractual safeguards for this cross-border transfer.
            </p>
          </section>

          <section>
            <h2>How long we keep it</h2>
            {/* CONFIRM: retention periods with a lawyer (PRD 14.5). */}
            <ul>
              <li>
                School requests that do not go ahead are anonymised 24 months after they are closed.
              </li>
              <li>
                For applications we decline, uploaded documents are deleted after 6 months and the application record
                after 12 months.
              </li>
              <li>Records of schools and coaches we work with are kept for as long as we work together.</li>
            </ul>
          </section>

          <section>
            <h2>Your rights</h2>
            <p>Under the Kenya Data Protection Act 2019 you have the right to:</p>
            <ul>
              <li>be told how your data is used, and get a copy of it;</li>
              <li>have inaccurate data corrected;</li>
              <li>have your data deleted;</li>
              <li>object to our use of it, and withdraw consent at any time.</li>
            </ul>
          </section>

          <section>
            <h2>How to make a request</h2>
            <p>
              Contact us on{" "}
              {phone && (
                <a href={telHref(phone)} className="font-semibold text-accent-text underline">
                  {formatLocalPhone(phone)}
                </a>
              )}
              {settings.email && (
                <>
                  {" "}
                  or{" "}
                  <a href={`mailto:${settings.email}`} className="font-semibold text-accent-text underline">
                    {settings.email}
                  </a>
                </>
              )}
              , or use the <Link href="/contact" className="font-semibold text-accent-text underline">contact page</Link>.
              We will confirm who you are, then respond within the time the Act requires.
            </p>
          </section>

          <section>
            <h2>Complaints</h2>
            <p>
              If you are unhappy with how we have handled your data, you can complain to the Office of the Data
              Protection Commissioner (ODPC) at odpc.go.ke. We would appreciate the chance to put things right first.
            </p>
          </section>

          <p className="type-small">
            We serve schools in {joinList(settings.counties)}. Notice version {PRIVACY_VERSION}.
          </p>
        </div>
      </article>
    </SectionShell>
  );
}
