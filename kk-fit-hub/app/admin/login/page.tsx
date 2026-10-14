import { Suspense } from "react";
import { Wordmark } from "@/components/site/Wordmark";
import { LoginFlow } from "@/components/admin/LoginFlow";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-svh place-items-center px-5 py-16">
      <div className="w-full max-w-[420px]">
        <Wordmark cta="admin-logo" />
        <div className="mt-8 rounded-[24px] border border-hairline bg-paper p-6 sm:p-8">
          <Suspense fallback={<h1 className="type-h3">Sign in</h1>}>
            <LoginFlow />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
