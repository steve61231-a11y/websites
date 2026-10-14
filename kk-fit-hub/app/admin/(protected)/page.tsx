import Link from "next/link";
import { firstName, whatsappMessages } from "@/content/whatsapp";
import { ContactButtons, Empty, Overdue, PageHeader, Tile } from "@/components/admin/ui";
import { requestNow, requireStaff } from "@/lib/admin/dal";
import { formatDate, isOverdue, todayEAT } from "@/lib/admin/format";
import { openInquiryStatuses } from "@/lib/admin/labels";

export const metadata = { title: "Overview" };

/** Overview: who do I need to call today? (PRD 15) */
export default async function OverviewPage() {
  const staff = await requireStaff();
  const db = staff.db;
  const now = await requestNow();
  const today = todayEAT(now);

  const [newReq, overdue, review, vetting, todayList, interest, activities] = await Promise.all([
    db.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    db
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .in("status", openInquiryStatuses)
      .lt("next_action_due", today),
    db.from("applications").select("id", { count: "exact", head: true }).eq("status", "new"),
    db.from("applications").select("id", { count: "exact", head: true }).eq("status", "in_vetting"),
    db
      .from("inquiries")
      .select("id, ref, contact_name, school_name, phone_e164, next_action, next_action_due, status")
      .in("status", openInquiryStatuses)
      .lte("next_action_due", today)
      .order("next_action_due")
      .limit(30),
    db.from("inquiry_activities").select("activity_id, inquiries!inner(type)").eq("inquiries.type", "interest"),
    db.from("activities").select("id, name, status").eq("status", "soon").order("sort_order"),
  ]);

  const counts = new Map<string, number>();
  for (const row of interest.data ?? []) counts.set(row.activity_id, (counts.get(row.activity_id) ?? 0) + 1);

  return (
    <>
      <PageHeader title={`Hello, ${staff.firstName}.`} sub="Who to call today, and what's waiting." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Tile label="New requests" value={newReq.count ?? 0} href="/admin/inquiries?status=new" />
        <Tile label="Follow-ups overdue" value={overdue.count ?? 0} href="/admin/inquiries?overdue=1" tone="alert" />
        <Tile label="Applications to review" value={review.count ?? 0} href="/admin/applications?status=new" />
        <Tile label="In vetting" value={vetting.count ?? 0} href="/admin/applications?status=in_vetting" />
      </div>

      <section className="mt-10" aria-labelledby="today-title">
        <h2 id="today-title" className="text-[22px] font-semibold">
          Today
        </h2>
        {(todayList.data ?? []).length === 0 ? (
          <div className="mt-4">
            <Empty>Nothing due today. Set a next action on a request to see it here.</Empty>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-hairline rounded-[20px] border border-hairline bg-paper">
            {(todayList.data ?? []).map((i) => (
              <li key={i.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <Link href={`/admin/inquiries/${i.id}`} className="font-semibold hover:underline">
                    {i.school_name ?? i.contact_name}
                  </Link>
                  <p className="text-[15px] text-text-2">
                    {i.next_action ?? "Follow up"} · due {formatDate(i.next_action_due)}{" "}
                    {isOverdue(i.next_action_due, now) && <Overdue />}
                  </p>
                </div>
                <ContactButtons
                  compact
                  phone={i.phone_e164}
                  whatsappText={whatsappMessages.adminToSchool(firstName(i.contact_name), staff.firstName, i.school_name ?? "your school")}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="demand-title">
        <h2 id="demand-title" className="text-[22px] font-semibold">
          Demand by activity
        </h2>
        <p className="mt-1 text-text-2">Register-interest requests per launching-soon activity.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(activities.data ?? []).map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-[16px] border border-hairline bg-paper px-4 py-3">
              <span>{a.name}</span>
              <span className="text-[19px] font-semibold tabular">{counts.get(a.id) ?? 0}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
