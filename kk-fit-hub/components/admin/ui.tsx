import { Clock, Mail, Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatLocalPhone, telHref, whatsappHref } from "@/lib/phone";
import { WhatsAppIcon } from "@/components/site/icons";

export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[32px] leading-tight font-bold tracking-[-0.02em] lg:text-[40px]">{title}</h1>
        {sub && <div className="mt-2 text-text-2">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <section className={cn("rounded-[20px] border border-hairline bg-paper p-5 lg:p-6", className)} aria-label={title}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 className="text-[19px] font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-[20px] border border-dashed border-input-border bg-paper p-6 text-text-2">{children}</p>;
}

const pillTones: Record<string, string> = {
  new: "bg-green-100 text-green-700",
  contacted: "bg-canvas text-text-2",
  demo_scheduled: "bg-canvas text-text",
  proposal_sent: "bg-canvas text-text",
  won: "bg-green-600 text-white",
  lost: "bg-canvas text-text-3",
  closed: "bg-canvas text-text-3",
  shortlisted: "bg-canvas text-text",
  in_vetting: "bg-orange-100 text-orange-700",
  approved: "bg-green-600 text-white",
  on_hold: "bg-canvas text-text-2",
  declined: "bg-canvas text-text-3",
};

export function StatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span className={cn("inline-flex h-7 items-center rounded-full px-3 text-[13px] font-semibold", pillTones[status] ?? "bg-canvas")}>
      {label}
    </span>
  );
}

/** Overdue: orange, with a clock icon and the word (never colour alone). */
export function Overdue() {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-orange-700">
      <Clock aria-hidden="true" size={14} strokeWidth={2} /> Overdue
    </span>
  );
}

const btn =
  "press inline-flex min-h-11 items-center gap-2 rounded-full border border-input-border bg-paper px-4 text-[15px] font-semibold text-text hover:border-green-600";

/** Call, WhatsApp and email buttons: local display, E.164 links (PRD 15). */
export function ContactButtons({ phone, email, whatsappText, compact = false }: { phone: string | null; email?: string | null; whatsappText?: string; compact?: boolean }) {
  if (!phone && !email) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {phone && (
        <a href={telHref(phone)} className={btn} aria-label={compact ? `Call ${formatLocalPhone(phone)}` : undefined}>
          <Phone aria-hidden="true" size={18} strokeWidth={1.75} className="text-green-700" />
          {compact ? "Call" : formatLocalPhone(phone)}
        </a>
      )}
      {phone && (
        <a href={whatsappHref(phone, whatsappText)} target="_blank" rel="noopener noreferrer" className={btn}>
          <WhatsAppIcon size={18} className="text-green-700" />
          WhatsApp
        </a>
      )}
      {email && !compact && (
        <a href={`mailto:${email}`} className={btn}>
          <Mail aria-hidden="true" size={18} strokeWidth={1.75} className="text-green-700" />
          Email
        </a>
      )}
    </div>
  );
}

export function Tile({ label, value, href, tone }: { label: string; value: number; href: string; tone?: "alert" }) {
  return (
    <Link href={href} className="press block rounded-[20px] border border-hairline bg-paper p-5 hover:border-green-600/40">
      <p className={cn("text-[40px] leading-none font-bold tracking-[-0.03em] tabular", tone === "alert" && value > 0 && "text-orange-700")}>
        {value}
      </p>
      <p className="mt-2 text-[15px] text-text-2">{label}</p>
    </Link>
  );
}

export function Dl({ rows }: { rows: [string, ReactNode][] }) {
  const shown = rows.filter(([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0));
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[180px_1fr]">
      {shown.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-text-2">{k}</dt>
          <dd className="break-words whitespace-pre-line">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export const inputSm =
  "min-h-11 rounded-xl border border-input-border bg-paper px-3 text-[16px] focus:outline-2 focus:outline-green-600";
export const btnSm =
  "press inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-[15px] font-semibold disabled:opacity-60";
