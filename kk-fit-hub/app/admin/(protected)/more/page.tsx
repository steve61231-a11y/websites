import Link from "next/link";
import { signOut } from "@/actions/auth";
import { PageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin/dal";

export const metadata = { title: "More" };

/** Mobile "More" tab: Roles, Activities, Content, Settings, Team, Log (PRD 15). */
export default async function MorePage() {
  const staff = await requireStaff();
  const items = [
    { href: "/admin/roles", label: "Open roles" },
    ...(staff.isOwner
      ? [
          { href: "/admin/activities", label: "Activities" },
          { href: "/admin/content", label: "Testimonials and partners" },
          { href: "/admin/settings", label: "Settings" },
          { href: "/admin/team", label: "Team" },
          { href: "/admin/log", label: "History" },
        ]
      : []),
    { href: "/admin/account", label: "Your account" },
  ];
  return (
    <>
      <PageHeader title="More" />
      <ul className="divide-y divide-hairline rounded-[20px] border border-hairline bg-paper">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="flex min-h-14 items-center justify-between px-4 font-medium">
              {i.label} <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
      <form action={signOut} className="mt-6">
        <button type="submit" className="min-h-11 font-semibold text-orange-700">
          Sign out
        </button>
      </form>
    </>
  );
}
