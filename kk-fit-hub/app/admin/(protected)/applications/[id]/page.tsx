import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { firstName, whatsappMessages } from "@/content/whatsapp";
import { ApplicationDecision } from "@/components/admin/ApplicationDecision";
import { Notes } from "@/components/admin/Notes";
import { OwnerTools } from "@/components/admin/OwnerTools";
import { Card, ContactButtons, Dl, PageHeader, StatusPill } from "@/components/admin/ui";
import { VettingChecklist, type Check } from "@/components/admin/VettingChecklist";
import { requestNow, requireStaff } from "@/lib/admin/dal";
import { formatDate, formatDateTime, timeAgo } from "@/lib/admin/format";
import {
  applicationStatuses,
  checkLabels,
  checkOrder,
  firstAidLabel,
  goodConductLabel,
  label,
  type ApplicationStatus,
  type CheckResult,
  type CheckType,
} from "@/lib/admin/labels";
import { loadTimeline } from "@/lib/admin/timeline";
import { formatLocalPhone } from "@/lib/phone";

export const metadata = { title: "Application" };

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const staff = await requireStaff();
  const [{ data }, settings, people, timeline] = await Promise.all([
    staff.db
      .from("applications")
      .select(
        "*, main:activities!applications_main_activity_id_fkey(name), application_activities(activities(name)), application_referees(id, name, phone_e164, relationship), application_files(id, kind, original_name, mime, size_bytes), vetting_checks(check_type, result, note, recorded_by, recorded_at), open_roles(title)",
      )
      .eq("id", id)
      .maybeSingle(),
    staff.db.from("site_settings").select("required_checks").limit(1).maybeSingle(),
    staff.db.from("profiles").select("id, full_name"),
    loadTimeline(staff, "application", id),
  ]);
  if (!data) notFound();
  const a = data;
  const required = new Set<CheckType>(settings.data?.required_checks ?? []);
  const nameOf = (pid: string | null) => (pid ? (people.data ?? []).find((p) => p.id === pid)?.full_name ?? "Staff" : null);
  const checks: Check[] = checkOrder.map((t) => {
    const c = a.vetting_checks.find((x) => x.check_type === t);
    return {
      type: t,
      result: (c?.result ?? "pending") as CheckResult,
      note: c?.note ?? null,
      required: required.has(t),
      recordedBy: nameOf(c?.recorded_by ?? null),
      recordedAt: c?.recorded_at ?? null,
    };
  });
  const blockers = checks.filter((c) => c.required && c.result !== "passed" && c.result !== "waived").map((c) => checkLabels[c.type]);
  const wa = whatsappMessages.adminToApplicant(firstName(a.full_name), staff.firstName, a.ref);
  const now = await requestNow();

  return (
    <>
      <Link href="/admin/applications" className="mb-4 inline-flex min-h-11 items-center gap-2 text-text-2 hover:text-text">
        <ArrowLeft aria-hidden="true" size={18} /> Coaches
      </Link>
      <PageHeader
        title={a.full_name}
        sub={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusPill status={a.status} label={label(applicationStatuses, a.status as ApplicationStatus)} />
            <span className="tabular">{a.ref}</span>
            <span>{a.main?.name ?? a.main_activity_other ?? "Other"}</span>
            <span>{timeAgo(a.created_at, now)}</span>
          </span>
        }
      />
      <div className="mb-6">
        <ContactButtons phone={a.phone_e164} email={a.email} whatsappText={wa} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid content-start gap-6">
          <Card title="Profile">
            <Dl
              rows={[
                ["Phone", formatLocalPhone(a.phone_e164)],
                ["Email", a.email],
                ["Lives in", a.county],
                ["Main discipline", a.main?.name ?? a.main_activity_other],
                ["Other disciplines", a.application_activities.map((x) => x.activities?.name).filter(Boolean).join(", ")],
                ["Years practising", String(a.years_practising)],
                ["Years coaching", String(a.years_coaching)],
                ["Highest rank", a.highest_rank],
                ["Experience", a.experience],
                ["Video", a.video_url ? <a href={a.video_url} target="_blank" rel="noopener noreferrer" className="text-green-700 underline break-all">{a.video_url}</a> : null],
                ["First aid", firstAidLabel[a.first_aid]],
                ["Good Conduct", goodConductLabel[a.good_conduct]],
                ["Applied for", a.open_roles?.title],
                ["Heard about us", a.heard_from],
                ["Source", a.source],
              ]}
            />
          </Card>
          <Card title="Availability">
            <Dl
              rows={[
                ["When", a.availability.join(", ")],
                ["Preference", a.work_preference],
                ["Counties", a.counties.join(", ")],
                ["Anything else", a.extra_notes],
              ]}
            />
          </Card>
          <Card title="Documents">
            {a.application_files.length === 0 ? (
              <p className="text-text-2">No documents uploaded.</p>
            ) : (
              <ul className="grid gap-2">
                {a.application_files.map((f) => (
                  <li key={f.id}>
                    <a
                      href={`/admin/files/${f.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 items-center gap-3 rounded-xl border border-hairline px-3 py-2 hover:border-green-600/40"
                    >
                      <FileText aria-hidden="true" size={20} strokeWidth={1.5} className="text-green-700" />
                      <span className="min-w-0 flex-1 truncate">{f.original_name}</span>
                      <span className="text-[13px] text-text-2">
                        {f.kind === "first_aid" ? "First aid" : "Certificate"} · {(f.size_bytes / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[13px] text-text-3">Links open for 60 seconds.</p>
          </Card>
          <Card title="Referees">
            {a.application_referees.length === 0 ? (
              <p className="text-text-2">No referees given yet.</p>
            ) : (
              <ul className="grid gap-4">
                {a.application_referees.map((r) => (
                  <li key={r.id} className="flex flex-col gap-2">
                    <p>
                      <span className="font-semibold">{r.name}</span>
                      {r.relationship ? `, ${r.relationship}` : ""}
                    </p>
                    <ContactButtons compact phone={r.phone_e164} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Notes and history">
            <Notes entityType="application" entityId={a.id} items={timeline} />
          </Card>
        </div>
        <div className="grid content-start gap-6">
          <Card title="Decision">
            <ApplicationDecision id={a.id} status={a.status as ApplicationStatus} isOwner={staff.isOwner} blockers={blockers} />
            {a.decline_reason && <p className="mt-4 text-[14px]">Declined: {a.decline_reason}</p>}
            {a.delete_after && (
              <p className="mt-2 text-[14px] text-text-2">Data retained until {formatDate(a.delete_after)}.</p>
            )}
            {a.decided_at && <p className="mt-2 text-[13px] text-text-3">Decided {formatDateTime(a.decided_at)}</p>}
          </Card>
          <Card title="Vetting checks">
            <VettingChecklist applicationId={a.id} checks={checks} isOwner={staff.isOwner} />
          </Card>
          {staff.isOwner && (
            <Card title="Data requests">
              <OwnerTools kind="application" id={a.id} refCode={a.ref} />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
