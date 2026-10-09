import type { Metadata } from "next";
import { Suspense } from "react";
import { CertificateView } from "./certificate-view";
import { PageTransition } from "@/components/motion/page";

export const metadata: Metadata = { title: "Certificate" };

export default function CertificatePage(props: PageProps<"/certificate/[number]">) {
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-dvh bg-black" />}>
        {props.params.then(({ number }) => (
          <CertificateView number={decodeURIComponent(number)} />
        ))}
      </Suspense>
    </PageTransition>
  );
}
