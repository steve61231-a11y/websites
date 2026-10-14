import { Suspense } from "react";
import { Wordmark } from "@/components/site/Wordmark";
import { AcceptInvite } from "@/components/admin/AcceptInvite";

export const metadata = { title: "Accept invite" };

export default function AcceptPage() {
  return (
    <main className="grid min-h-svh place-items-center px-5 py-16">
      <div className="w-full max-w-[420px]">
        <Wordmark cta="admin-logo" />
        <div className="mt-8 rounded-[24px] border border-hairline bg-paper p-6 sm:p-8">
          <Suspense fallback={<h1 className="type-h3">Accept your invite</h1>}>
            <AcceptInvite />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
