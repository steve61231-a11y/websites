import Link from "next/link";
import type { Activity } from "@/content/activities";
import { statusLabel } from "@/content/activities";
import { brand, joinList, type PublicSettings } from "@/content/site";
import { formatLocalPhone, telHref } from "@/lib/phone";
import { WhatsAppIcon } from "./icons";
import { Wordmark } from "./Wordmark";

const linkClass = "inline-flex min-h-11 items-center text-fg-2 hover:text-fg";

/** Dark footer (PRD 3). */
export function Footer({
  activities,
  settings,
  whatsappHref,
  year,
}: {
  activities: Activity[];
  settings: PublicSettings;
  whatsappHref: string;
  year: number;
}) {
  const socials = Object.entries(settings.socials);
  return (
    <footer data-theme="dark" className="bg-ink-800! pt-20 pb-[calc(32px+env(safe-area-inset-bottom))] lg:pt-24">
      <div className="container-site">
        <div className="flex flex-col gap-3 border-b border-hairline pb-10 md:flex-row md:items-center md:justify-between">
          <Wordmark cta="footer-logo" />
          <p className="max-w-md text-fg-2">{brand.line}</p>
        </div>

        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
          <nav aria-labelledby="footer-programmes">
            <h2 id="footer-programmes" className="mb-3 text-[15px] font-semibold">
              Programmes
            </h2>
            <ul>
              {activities.map((a) => (
                <li key={a.slug}>
                  <Link href={`/programmes/${a.slug}`} data-cta="footer-programme" className={linkClass}>
                    <span>
                      {a.name}
                      {a.status !== "hidden" && (
                        <span className="text-fg-3"> · {statusLabel[a.status]}</span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-labelledby="footer-schools">
            <h2 id="footer-schools" className="mb-3 text-[15px] font-semibold">
              Schools
            </h2>
            <ul>
              <li>
                <Link href="/schools#how-it-works" data-cta="footer-how" className={linkClass}>
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/schools#standard" data-cta="footer-standard" className={linkClass}>
                  Our standard
                </Link>
              </li>
              <li>
                <Link href="/request?source=footer" data-cta="footer-request" className={linkClass}>
                  Request a demonstration
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-coaches">
            <h2 id="footer-coaches" className="mb-3 text-[15px] font-semibold">
              Coaches
            </h2>
            <ul>
              <li>
                <Link href="/join" data-cta="footer-join" className={linkClass}>
                  Join the team
                </Link>
              </li>
              <li>
                <Link href="/join#open-roles" data-cta="footer-roles" className={linkClass}>
                  Open roles
                </Link>
              </li>
              <li>
                <Link href="/join/apply?source=footer" data-cta="footer-apply" className={linkClass}>
                  Apply
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-organisation">
            <h2 id="footer-organisation" className="mb-3 text-[15px] font-semibold">
              Organisation
            </h2>
            <ul>
              <li>
                <Link href="/about" data-cta="footer-about" className={linkClass}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" data-cta="footer-contact" className={linkClass}>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" data-cta="footer-privacy" className={linkClass}>
                  Privacy
                </Link>
              </li>
            </ul>
          </nav>
          <div>
            <h2 className="mb-3 text-[15px] font-semibold">Contact</h2>
            <ul>
              {settings.phones.map((p, i) => (
                <li key={p}>
                  <a href={telHref(p)} data-cta={`footer-call-${i + 1}`} className={`${linkClass} tabular`}>
                    {formatLocalPhone(p)}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cta="footer-whatsapp"
                  className={`${linkClass} gap-2`}
                >
                  <WhatsAppIcon size={18} /> WhatsApp
                </a>
              </li>
              {settings.email && (
                <li>
                  <a href={`mailto:${settings.email}`} data-cta="footer-email" className={linkClass}>
                    {settings.email}
                  </a>
                </li>
              )}
            </ul>
            {socials.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-x-4">
                {socials.map(([name, url]) => (
                  <li key={name}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cta={`footer-social-${name.toLowerCase()}`}
                      className={`${linkClass} capitalize`}
                    >
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <p className="border-t border-hairline pt-8 text-fg-2">Serving {joinList(settings.counties)}.</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 type-small text-fg-2">
          <p>© {year} KK Fit Hub</p>
          <Link href="/privacy" data-cta="footer-privacy" className={linkClass}>
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
