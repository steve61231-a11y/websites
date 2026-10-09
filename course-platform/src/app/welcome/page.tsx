import type { Metadata } from "next";
import { Suspense } from "react";
import { Welcome } from "./welcome";
import { PageTransition } from "@/components/motion/page";

export const metadata: Metadata = { title: "You're in" };

export default function WelcomePage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-dvh bg-black" />}>
        <Welcome />
      </Suspense>
    </PageTransition>
  );
}
