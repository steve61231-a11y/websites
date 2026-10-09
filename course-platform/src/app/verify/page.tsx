import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { VerifyForm } from "./verify-form";
import { PageTransition } from "@/components/motion/page";

export const metadata: Metadata = { title: "Verify a certificate" };

export default function VerifyPage() {
  return (
    <>
      <SiteNav />
      <PageTransition>
        <main className="wrap flex min-h-[80svh] flex-col items-center pb-24 pt-40 text-center">
          <p className="eyebrow">Certificates</p>
          <h1 className="display mt-4 text-[clamp(40px,7vw,88px)] text-white">Verify a certificate.</h1>
          <p className="mt-5 max-w-md text-[18px] leading-relaxed text-muted">Enter the ID printed on any THE PROD certificate to confirm it&apos;s genuine.</p>
          <VerifyForm />
        </main>
      </PageTransition>
      <SiteFooter />
    </>
  );
}
