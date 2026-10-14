import type { Metadata } from "next";
import { Suspense } from "react";
import { EnrollFlow } from "./enroll-flow";
import { PageTransition } from "@/components/motion/page";

export const metadata: Metadata = { title: "Get access" };

export default function EnrollPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-dvh bg-black" />}>
        <EnrollFlow />
      </Suspense>
    </PageTransition>
  );
}
