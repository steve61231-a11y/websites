import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { firstName, whatsappMessages } from "@/content/whatsapp";
import { InquiryControls } from "@/components/admin/InquiryControls";
import { Notes } from "@/components/admin/Notes";
import { OwnerTools } from "@/components/admin/OwnerTools";
import { Card, ContactButtons, Dl, Overdue, PageHeader, StatusPill } from "@/components/admin/ui";
import { requestNow, requireStaff } from "@/lib/admin/dal";
import { formatDate, formatDateTime, isOverdue, timeAgo } from "@/lib/admin/format";
import { inquiryStatuses, inquiryTypes, label } from "@/lib/admin/labels";
import { inquiryListColumns } from "@/lib/admin/queries";
import { loadTimeline } from "@/lib/admin/timeline";
import { formatLocalPhone } from "@/lib/phone";

export const metadata = { title: "Request" };

export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const staff = await requireStaff();
  const [{ data }, team, timeline] = await Promise.all([
    staff.db.from("inquiries").select(`${inquiryListColumns}, consent_at, consent_version, anonymised_at`).eq("id", id).maybeSingle(),
    staff.db.from("profiles").select("id, full_name").eq("active", true).order("full_name"),
    loadTimeline(staff, "inquiry", id),
  ]);
  if (!data) notFound();
  const i = data as unknown as {
    id: string; ref: string; type: "demo" | "interest" | "general"; status: (typeof inquiryStatuses)[number]["value"];
    contact_name: string; contact_role: string | null; school_name: string | null; county: string | null; county_other: string | null;
    phone_e164: string | null; email: string | null; created_at: string; next_action: string | null; next_action_due: string | null;
    assigned_to: string | null; source: string | null; lost_reason: string | null; institution_type: string | null; sector: string | null;
    learners_band: string | null; grades: string[]; preferred_days: string[]; preferred_time: string | null; start_term: string | null;
    contact_pref: string | null; message: string | null; utm: Record<string, string>; consent_at: string; consent_version: string;
    inquiry_activities: { activities: { name: string } | null }[];
  };
  const now = await requestNow();
  const wa = whatsappMessages.adminToSchool(firstName(i.contact_name), staff.firstName, i.school_name ?? "your school");

  return (
    <>
      <Link href="/admin/inquiries" className="mb-4 inline-flex min-h-11 items-center gap-2 text-text-2 hover:text-text">
        <ArrowLeft aria-hidden="true" size={18} /> Requests
      </Link>
      <PageHeader
        title={i.school_name ?? i.contact_name}
        sub={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusPill status={i.status} label={label(inquiryStatuses, i.status)} />
            <span className="tabular">{i.ref}</span>
            <span>{label(inquiryTypes, i.type)}</span>
            <span>{timeAgo(i.created_at, now)}</span>
            {isOverdue(i.next_action_due, now) && <Overdue />}
          </span>
        }
      />
      <div className="mb-6">
        <ContactButtons phone={i.phone_e164} email={i.email} whatsappText={wa} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid content-start gap-6">
          <Card title="Details">
            <Dl
              rows={[
                ["Contact", `${i.contact_name}${i.contact_role ? ` (${i.contact_role})` : ""}`],
                ["School", i.school_name],
                ["County", i.county === "Other" ? `Other: ${i.county_other ?? ""}` : i.county],
                ["Phone", i.phone_e164 ? formatLocalPhone(i.phone_e164) : null],
                ["Email", i.email],
                ["Activities", i.inquiry_activities.map((a) => a.activities?.name).filter(Boolean).join(", ")],
                ["Message", i.message],
                ["Institution", i.institution_type],
                ["Sector", i.sector],
                ["Learners", i.learners_band],
                ["Grades", i.grades.join(", ")],
                ["Preferred days", i.preferred_days.join(", ")],
                ["Preferred time", i.preferred_time],
                ["Start", i.start_term],
                ["Best way to reach", i.contact_pref],
                ["Source", [i.source, ...Object.entries(i.utm ?? {}).map(([k, v]) => `${k}=${v}`)].filter(Boolean).join(" · ")],
                ["Received", formatDateTime(i.created_at)],
                ["Consent", `${formatDateTime(i.consent_at)} (notice ${i.consent_version})`],
                ["Next action due", i.next_action_due ? formatDate(i.next_action_due) : null],
              ]}
            />
          </Card>
          <Card title="Notes and history">
            <Notes entityType="inquiry" entityId={i.id} items={timeline} />
          </Card>
        </div>
        <div className="grid content-start gap-6">
          <Card title="Pipeline">
            <InquiryControls
              id={i.id}
              status={i.status}
              lostReason={i.lost_reason}
              nextAction={i.next_action}
              nextActionDue={i.next_action_due}
              assignedTo={i.assigned_to}
              team={team.data ?? []}
            />
          </Card>
          {staff.isOwner && (
            <Card title="Data requests">
              <OwnerTools kind="inquiry" id={i.id} refCode={i.ref} />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
