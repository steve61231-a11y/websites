import type { Metadata } from "next";
import { Suspense } from "react";
import { CertificateView } from "./certificate-view";

export const metadata: Metadata = { title: "Certificate" };

export default function CertificatePage(props: PageProps<"/certificates/[number]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f5f5f7]" />}>
      {props.params.then(({ number }) => (
        <CertificateView number={decodeURIComponent(number)} />
      ))}
    </Suspense>
  );
}
