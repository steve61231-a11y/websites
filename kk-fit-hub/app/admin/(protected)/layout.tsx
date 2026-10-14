import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { ToastProvider } from "@/components/admin/Toast";
import { requireStaff } from "@/lib/admin/dal";

/** Protected admin shell. The proxy redirects signed-out visitors; this
 * layout checks staff status again on the server (PRD 14.4). */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <Suspense fallback={null}>
        <Nav />
      </Suspense>
      <main id="main" className="min-h-svh pb-28 lg:pb-12 lg:pl-60">
        <div className="mx-auto max-w-[1200px] px-5 pt-8 lg:px-10 lg:pt-10">
          <Suspense fallback={<p className="text-text-2">Loading…</p>}>{children}</Suspense>
        </div>
      </main>
    </ToastProvider>
  );
}

async function Nav() {
  const staff = await requireStaff();
  const [requests, review] = await Promise.all([
    staff.db.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    staff.db.from("applications").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  return (
    <AdminNav isOwner={staff.isOwner} name={staff.fullName} newRequests={requests.count ?? 0} toReview={review.count ?? 0} />
  );
}
