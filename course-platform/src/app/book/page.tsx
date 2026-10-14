import type { Metadata } from "next";
import { Suspense } from "react";
import { EnrollFlow } from "../enroll/enroll-flow";
import { PageTransition } from "@/components/motion/page";

export const metadata: Metadata = { title: "Book a 1:1 session" };

export default function BookPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-dvh bg-black" />}>
        <EnrollFlow mode="session" />
      </Suspense>
    </PageTransition>
  );
}
