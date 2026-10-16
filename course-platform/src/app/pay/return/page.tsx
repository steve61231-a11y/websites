import type { Metadata } from "next";
import { Suspense } from "react";
import { ReturnFlow } from "./return-flow";
import { PageTransition } from "@/components/motion/page";

export const metadata: Metadata = { title: "Payment" };

export default function PayReturnPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-dvh bg-black" />}>
        <ReturnFlow />
      </Suspense>
    </PageTransition>
  );
}
