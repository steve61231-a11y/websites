import { SettingsForm, type SettingsRow } from "@/components/admin/SettingsForm";
import { PageHeader } from "@/components/admin/ui";
import { requireOwner } from "@/lib/admin/dal";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const staff = await requireOwner();
  const { data } = await staff.db.from("site_settings").select("*").limit(1).maybeSingle();
  if (!data) return <p>Settings are missing. Run the seed.</p>;
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsForm
        settings={{ ...data, socials: (data.socials ?? {}) as Record<string, string> } as SettingsRow}
        emailReady={Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)}
      />
    </>
  );
}
