import { Download } from "lucide-react";
import Link from "next/link";
import { FilterBar } from "@/components/admin/FilterBar";
import { Empty, Overdue, PageHeader, StatusPill, btnSm } from "@/components/admin/ui";
import { requestNow, requireStaff } from "@/lib/admin/dal";
import { isOverdue, timeAgo } from "@/lib/admin/format";
import { inquiryStatuses, inquiryTypes, label } from "@/lib/admin/labels";
import { inquiryIdsForActivity, inquiryQuery, parseInquiryFilters } from "@/lib/admin/queries";
import { cn } from "@/lib/cn";

export const metadata = { title: "Requests" };

type Row = {
  id: string;
  ref: string;
  type: "demo" | "interest" | "general";
  status: (typeof inquiryStatuses)[number]["value"];
  contact_name: string;
  school_name: string | null;
  county: string | null;
  created_at: string;
  next_action: string | null;
  next_action_due: string | null;
  inquiry_activities: { activities: { name: string } | null }[];
  assignee: { full_name: string } | null;
};

/** Requests pipeline (PRD 15): filters, search, list or board, CSV export. */
export default async function InquiriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const staff = await requireStaff();
  const params = await searchParams;
  const filters = parseInquiryFilters(params);
  const now = await requestNow();
  const [{ data, count, error }, activities, team, settings] = await Promise.all([
    inquiryQuery(staff.db, filters, now, await inquiryIdsForActivity(staff.db, filters.activity)).limit(300),
    staff.db.from("activities").select("slug, name").order("sort_order"),
    staff.db.from("profiles").select("id, full_name").eq("active", true).order("full_name"),
    staff.db.from("site_settings").select("counties").limit(1).maybeSingle(),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const qs = new URLSearchParams(Object.entries(params).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));
  const viewHref = (view: string) => {
    const next = new URLSearchParams(qs);
    next.set("view", view);
    return `/admin/inquiries?${next.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Requests"
        sub={`${count ?? 0} ${count === 1 ? "request" : "requests"}`}
        actions={
          <>
            <div className="hidden rounded-full border border-input-border bg-paper p-1 lg:flex" role="group" aria-label="View">
              {(["list", "board"] as const).map((v) => (
                <Link
                  key={v}
                  href={viewHref(v)}
                  aria-current={filters.view === v ? "true" : undefined}
                  className="min-h-9 rounded-full px-4 py-1.5 text-[14px] font-semibold capitalize aria-[current=true]:bg-ink-900 aria-[current=true]:text-white"
                >
                  {v}
                </Link>
              ))}
            </div>
            <a href={`/admin/inquiries/export?${qs.toString()}`} className={cn(btnSm, "border border-input-border bg-paper")}>
              <Download aria-hidden="true" size={18} /> CSV
            </a>
          </>
        }
      />
      <FilterBar
        searchLabel="Search school, name, phone or reference"
        filters={[
          { name: "status", label: "Status", options: inquiryStatuses.map((s) => ({ value: s.value, label: s.label })) },
          { name: "type", label: "Type", options: inquiryTypes },
          { name: "activity", label: "Activity", options: (activities.data ?? []).map((a) => ({ value: a.slug, label: a.name })) },
          { name: "county", label: "County", options: (settings.data?.counties ?? []).map((c) => ({ value: c, label: c })).concat([{ value: "Other", label: "Other" }]) },
          {
            name: "assignee",
            label: "Assignee",
            options: [{ value: "none", label: "Unassigned" }, ...(team.data ?? []).map((p) => ({ value: p.id, label: p.full_name }))],
          },
        ]}
      />
      {error && <p className="mb-4 text-orange-700">Couldn&apos;t load requests: {error.message}</p>}

      {rows.length === 0 ? (
        <Empty>
          {Object.keys(params).length > 0
            ? "No requests match these filters."
            : "No new requests. Share the site link on WhatsApp to get the first one."}
        </Empty>
      ) : filters.view === "board" ? (
        <div className="no-scrollbar -mx-10 hidden gap-4 overflow-x-auto px-10 pb-4 lg:flex">
          {inquiryStatuses.map((s) => {
            const col = rows.filter((r) => r.status === s.value);
            return (
              <section key={s.value} aria-label={s.label} className="w-72 shrink-0">
                <h2 className="mb-3 flex items-center justify-between px-1 text-[15px] font-semibold">
                  {s.label} <span className="text-text-2 tabular">{col.length}</span>
                </h2>
                <ul className="flex flex-col gap-2">
                  {col.map((r) => (
                    <li key={r.id}>
                      <InquiryCard row={r} now={now} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : null}
      {rows.length > 0 && (
        <ul className={cn("flex flex-col gap-2", filters.view === "board" && "lg:hidden")}>
          {rows.map((r) => (
            <li key={r.id}>
              <InquiryCard row={r} now={now} showStatus />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function InquiryCard({ row, now, showStatus = false }: { row: Row; now: number; showStatus?: boolean }) {
  const overdue = isOverdue(row.next_action_due, now) && ["new", "contacted", "demo_scheduled", "proposal_sent"].includes(row.status);
  const acts = row.inquiry_activities.map((a) => a.activities?.name).filter(Boolean).join(", ");
  return (
    <Link
      href={`/admin/inquiries/${row.id}`}
      className={cn(
        "block rounded-[16px] border bg-paper p-4 hover:border-green-600/40",
        overdue ? "border-orange-700/50" : "border-hairline",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{row.school_name ?? row.contact_name}</p>
          <p className="truncate text-[14px] text-text-2">
            {row.contact_name} · {label(inquiryTypes, row.type)}
            {row.county ? ` · ${row.county}` : ""}
          </p>
        </div>
        {showStatus && <StatusPill status={row.status} label={label(inquiryStatuses, row.status)} />}
      </div>
      {acts && <p className="mt-2 text-[14px] text-text-2">{acts}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-text-2">
        <span className="tabular">{row.ref}</span>
        <span>{timeAgo(row.created_at, now)}</span>
        {row.assignee && <span>{row.assignee.full_name}</span>}
        {overdue && <Overdue />}
      </div>
    </Link>
  );
}
