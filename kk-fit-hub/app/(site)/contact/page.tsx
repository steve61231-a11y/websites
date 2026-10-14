import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { Suspense } from "react";
import { contactPage } from "@/content/pages";
import { joinList } from "@/content/site";
import { whatsappMessages } from "@/content/whatsapp";
import { WhatsAppIcon } from "@/components/site/icons";
import { SectionShell } from "@/components/site/SectionShell";
import { ContactForm } from "@/components/forms/ContactForm";
import { getSettings } from "@/lib/data/public";
import { formatLocalPhone, telHref, whatsappHref } from "@/lib/phone";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Call, WhatsApp or message KK Fit Hub. Serving Nairobi, Kiambu, Kajiado, Machakos, Nakuru and Homa Bay.",
  alternates: { canonical: "/contact" },
};

const rowClass =
  "press flex min-h-16 items-center gap-4 rounded-[20px] border border-hairline bg-surface px-5 text-[19px] font-semibold hover:border-green-600/40";

/** 7.7 Contact. */
export default async function ContactPage() {
  const settings = await getSettings();
  const wa = whatsappHref(settings.whatsappE164, whatsappMessages.general);

  return (
    <SectionShell
      theme="light"
      pad={false}
      className="pt-[calc(var(--header-h)+64px)] pb-24 lg:pt-[calc(var(--header-h)+112px)] lg:pb-40"
    >
      <div className="container-site grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h1 className="type-display-xl rise-in-solid">{contactPage.h1}</h1>
          {/* CONFIRM: response time (from settings). */}
          <p className="type-lead rise-in-solid mt-6 text-fg-2" style={{ "--i": 1 } as React.CSSProperties}>
            {contactPage.sub(settings.responseTimeText)}
          </p>
          <ul className="rise-in mt-10 flex flex-col gap-3" style={{ "--i": 2 } as React.CSSProperties}>
            {settings.phones.map((p, i) => (
              <li key={p}>
                <a href={telHref(p)} data-cta={`contact-call-${i + 1}`} className={rowClass}>
                  <Phone aria-hidden="true" size={22} strokeWidth={1.5} className="text-green-700" />
                  <span className="tabular">{formatLocalPhone(p)}</span>
                </a>
              </li>
            ))}
            <li>
              <a href={wa} target="_blank" rel="noopener noreferrer" data-cta="contact-whatsapp" className={rowClass}>
                <WhatsAppIcon size={22} className="text-green-700" />
                {contactPage.whatsappLabel}
                <span className="ml-auto type-small font-normal text-fg-3 tabular">
                  {formatLocalPhone(settings.whatsappE164)}
                </span>
              </a>
            </li>
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`} data-cta="contact-email" className={rowClass}>
                  <Mail aria-hidden="true" size={22} strokeWidth={1.5} className="text-green-700" />
                  {settings.email}
                </a>
              </li>
            )}
          </ul>
          <div className="mt-10 flex gap-3 text-fg-2">
            <MapPin aria-hidden="true" size={22} strokeWidth={1.5} className="mt-0.5 shrink-0 text-green-700" />
            <p>
              <span className="sr-only">{contactPage.countiesTitle}: </span>
              {joinList(settings.counties)}
            </p>
          </div>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <h2 className="type-h3">{contactPage.formTitle}</h2>
          <div className="mt-6">
            <Suspense>
              <ContactForm responseTime={settings.responseTimeText} />
            </Suspense>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
