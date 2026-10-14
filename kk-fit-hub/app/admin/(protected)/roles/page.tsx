import { PageHeader } from "@/components/admin/ui";
import { RoleEditor, type RoleRow } from "@/components/admin/RoleEditor";
import { requireStaff } from "@/lib/admin/dal";

export const metadata = { title: "Open roles" };

export default async function RolesPage() {
  const staff = await requireStaff();
  const [roles, activities, settings] = await Promise.all([
    staff.db.from("open_roles").select("id, title, activity_id, counties, employment_type, description, is_open, sort_order").order("sort_order"),
    staff.db.from("activities").select("id, name").order("sort_order"),
    staff.db.from("site_settings").select("counties").limit(1).maybeSingle(),
  ]);
  const counties = settings.data?.counties ?? [];
  return (
    <>
      <PageHeader title="Open roles" sub="Shown on the Join the Team page while open." />
      <div className="grid gap-3">
        <RoleEditor activities={activities.data ?? []} counties={counties} canDelete={false} />
        {(roles.data ?? []).map((r) => (
          <RoleEditor key={r.id} role={r as RoleRow} activities={activities.data ?? []} counties={counties} canDelete={staff.isOwner} />
        ))}
      </div>
    </>
  );
}
