import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInFlow } from "./sign-in-flow";
import { PageTransition } from "@/components/motion/page";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-dvh bg-black" />}>
        <SignInFlow />
      </Suspense>
    </PageTransition>
  );
}
