import { Download } from "lucide-react";
import Link from "next/link";
import { FilterBar } from "@/components/admin/FilterBar";
import { Empty, PageHeader, StatusPill, btnSm } from "@/components/admin/ui";
import { requestNow, requireStaff } from "@/lib/admin/dal";
import { timeAgo } from "@/lib/admin/format";
import { applicationStatuses, label } from "@/lib/admin/labels";
import { activityIdForSlug, applicationQuery, parseApplicationFilters } from "@/lib/admin/queries";
import { cn } from "@/lib/cn";

export const metadata = { title: "Coaches" };

type Row = {
  id: string; ref: string; status: (typeof applicationStatuses)[number]["value"]; full_name: string; county: string;
  created_at: string; years_practising: number; years_coaching: number; highest_rank: string; main_activity_other: string | null;
  main: { name: string } | null; vetting_checks: { result: string }[];
};

/** Applications pipeline (PRD 15). */
export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const staff = await requireStaff();
  const params = await searchParams;
  const filters = parseApplicationFilters(params);
  const now = await requestNow();
  const [activities, settings] = await Promise.all([
    staff.db.from("activities").select("slug, name").order("sort_order"),
    staff.db.from("site_settings").select("counties").limit(1).maybeSingle(),
  ]);
  const { data, count } = await applicationQuery(staff.db, filters, await activityIdForSlug(staff.db, filters.activity)).limit(300);
  const rows = (data ?? []) as unknown as Row[];
  const qs = new URLSearchParams(Object.entries(params).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));

  return (
    <>
      <PageHeader
        title="Coaches"
        sub={`${count ?? 0} ${count === 1 ? "application" : "applications"}`}
        actions={
          <a href={`/admin/applications/export?${qs.toString()}`} className={cn(btnSm, "border border-input-border bg-paper")}>
            <Download aria-hidden="true" size={18} /> CSV
          </a>
        }
      />
      <FilterBar
        searchLabel="Search name, phone, email, rank or reference"
        filters={[
          { name: "status", label: "Status", options: applicationStatuses },
          { name: "activity", label: "Discipline", options: (activities.data ?? []).map((a) => ({ value: a.slug, label: a.name })) },
          { name: "county", label: "County", options: (settings.data?.counties ?? []).map((c) => ({ value: c, label: c })) },
        ]}
      />
      {rows.length === 0 ? (
        <Empty>
          {Object.keys(params).length > 0
            ? "No applications match these filters."
            : "No applications yet. Share the Join the Team page with coaches you'd like to meet."}
        </Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => {
            const passed = r.vetting_checks.filter((c) => c.result === "passed" || c.result === "waived").length;
            return (
              <li key={r.id}>
                <Link href={`/admin/applications/${r.id}`} className="block rounded-[16px] border border-hairline bg-paper p-4 hover:border-green-600/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{r.full_name}</p>
                      <p className="truncate text-[14px] text-text-2">
                        {r.main?.name ?? r.main_activity_other ?? "Other"} · {r.highest_rank} · {r.county}
                      </p>
                    </div>
                    <StatusPill status={r.status} label={label(applicationStatuses, r.status)} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 text-[13px] text-text-2">
                    <span className="tabular">{r.ref}</span>
                    <span>{timeAgo(r.created_at, now)}</span>
                    <span>
                      {r.years_practising} yrs practising · {r.years_coaching} coaching
                    </span>
                    <span className="tabular">
                      Checks {passed}/{r.vetting_checks.length}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
