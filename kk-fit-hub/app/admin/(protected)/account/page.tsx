import Link from "next/link";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin/dal";

export const metadata = { title: "Your account" };

export default async function AccountPage() {
  const staff = await requireStaff();
  const { data } = await staff.db.auth.mfa.listFactors();
  const mfa = (data?.totp ?? []).some((f) => f.status === "verified");
  return (
    <>
      <PageHeader title="Your account" sub={`${staff.fullName} · ${staff.email} · ${staff.role === "owner" ? "Owner" : "Staff"}`} />
      <Card title="Two-factor sign-in">
        {mfa ? (
          <p>An authenticator app is set up for your account.</p>
        ) : (
          <>
            <p className="text-text-2">Recommended: add an authenticator app so a stolen password isn&apos;t enough to sign in.</p>
            <Link href="/admin/login?step=enrol" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-green-600 px-5 font-semibold text-white">
              Set up two-factor
            </Link>
          </>
        )}
      </Card>
    </>
  );
}
