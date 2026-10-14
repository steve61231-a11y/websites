import { ActivityEditor, type ActivityRow } from "@/components/admin/ActivityEditor";
import { PageHeader } from "@/components/admin/ui";
import { requireOwner } from "@/lib/admin/dal";

export const metadata = { title: "Activities" };

export default async function ActivitiesPage() {
  const staff = await requireOwner();
  const { data } = await staff.db
    .from("activities")
    .select("id, slug, name, one_liner, description, outcomes, age_range, status, recruiting, sort_order")
    .order("sort_order");
  return (
    <>
      <PageHeader title="Activities" sub="Drive the Programmes pages, the hub and the form chips. Saving refreshes the public site." />
      <div className="grid gap-3">
        {(data ?? []).map((a) => (
          <ActivityEditor key={a.id} activity={a as ActivityRow} />
        ))}
      </div>
    </>
  );
}
