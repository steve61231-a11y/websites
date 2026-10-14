import { resolveStaff } from "@/lib/admin/dal";
import { formatDate, toCsv } from "@/lib/admin/format";
import { inquiryIdsForActivity, inquiryQuery, parseInquiryFilters } from "@/lib/admin/queries";
import { formatLocalPhone } from "@/lib/phone";

/** CSV export of the current filter (PRD 15). */
export async function GET(request: Request) {
  const r = await resolveStaff();
  if (!r.ok) return new Response("Not signed in", { status: 401 });
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const filters = parseInquiryFilters(params);
  const ids = await inquiryIdsForActivity(r.staff.db, filters.activity);
  const { data, error } = await inquiryQuery(r.staff.db, filters, Date.now(), ids).limit(5000);
  if (error) return new Response("Export failed", { status: 500 });
  type Row = Record<string, unknown> & {
    phone_e164: string | null;
    inquiry_activities: { activities: { name: string } | null }[];
    assignee: { full_name: string } | null;
  };
  const rows = ((data ?? []) as unknown as Row[]).map((row) => ({
    ...row,
    phone: row.phone_e164 ? formatLocalPhone(row.phone_e164) : "",
    activities: row.inquiry_activities.map((a) => a.activities?.name).filter(Boolean),
    assignee: row.assignee?.full_name ?? "",
    created: formatDate(row.created_at as string),
  }));
  const csv = toCsv(rows, [
    "ref", "created", "type", "status", "school_name", "contact_name", "contact_role", "county", "county_other", "phone", "email",
    "activities", "institution_type", "sector", "learners_band", "grades", "preferred_days", "preferred_time", "start_term",
    "contact_pref", "message", "source", "assignee", "next_action", "next_action_due", "lost_reason",
  ]);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="kk-requests-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
