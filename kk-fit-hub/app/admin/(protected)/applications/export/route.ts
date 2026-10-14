import { resolveStaff } from "@/lib/admin/dal";
import { formatDate, toCsv } from "@/lib/admin/format";
import { activityIdForSlug, applicationQuery, parseApplicationFilters } from "@/lib/admin/queries";
import { formatLocalPhone } from "@/lib/phone";

/** CSV export of the current filter (PRD 15). No documents are included. */
export async function GET(request: Request) {
  const r = await resolveStaff();
  if (!r.ok) return new Response("Not signed in", { status: 401 });
  const filters = parseApplicationFilters(Object.fromEntries(new URL(request.url).searchParams));
  const { data, error } = await applicationQuery(r.staff.db, filters, await activityIdForSlug(r.staff.db, filters.activity)).limit(5000);
  if (error) return new Response("Export failed", { status: 500 });
  type Row = Record<string, unknown> & { phone_e164: string; main: { name: string } | null; main_activity_other: string | null; vetting_checks: { check_type: string; result: string }[] };
  const rows = ((data ?? []) as unknown as Row[]).map((row) => ({
    ...row,
    phone: formatLocalPhone(row.phone_e164),
    discipline: row.main?.name ?? row.main_activity_other ?? "",
    checks: row.vetting_checks.map((c) => `${c.check_type}:${c.result}`),
    created: formatDate(row.created_at as string),
  }));
  const csv = toCsv(rows, [
    "ref", "created", "status", "full_name", "phone", "email", "county", "discipline", "years_practising", "years_coaching",
    "highest_rank", "first_aid", "good_conduct", "availability", "work_preference", "counties", "video_url", "source", "checks",
  ]);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="kk-applications-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
