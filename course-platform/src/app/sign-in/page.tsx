import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInFlow } from "./sign-in-flow";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-black" />}>
      <SignInFlow />
    </Suspense>
  );
}
