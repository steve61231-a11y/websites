import type { Metadata } from "next";
import { Footer, SiteNav } from "@/components/nav";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Verify a certificate" };

export default function VerifyPage() {
  return (
    <>
      <SiteNav />
      <main className="wrap flex min-h-[70dvh] flex-col items-center pb-24 pt-20 text-center sm:pt-28">
        <h1 className="display text-[clamp(36px,6vw,64px)]">Verify a certificate.</h1>
        <p className="mt-3 max-w-md text-[19px] text-muted">Enter the certificate ID printed at the bottom of any Lumen certificate.</p>
        <VerifyForm />
      </main>
      <Footer />
    </>
  );
}
