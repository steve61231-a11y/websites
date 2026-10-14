import { TeamPanel } from "@/components/admin/TeamPanel";
import { PageHeader } from "@/components/admin/ui";
import { requireOwner } from "@/lib/admin/dal";
import { createServiceClient } from "@/lib/supabase/admin";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const staff = await requireOwner();
  const { data } = await staff.db.from("profiles").select("id, full_name, email, role, active").order("full_name");
  const admin = createServiceClient();
  const members = await Promise.all(
    (data ?? []).map(async (m) => {
      const { data: factors } = await admin.auth.admin.mfa.listFactors({ userId: m.id });
      return { ...m, mfa: (factors?.factors ?? []).some((f) => f.status === "verified"), self: m.id === staff.id };
    }),
  );
  return (
    <>
      <PageHeader title="Team" sub="Two-factor sign-in is required for owners and recommended for staff." />
      <TeamPanel members={members} />
    </>
  );
}
