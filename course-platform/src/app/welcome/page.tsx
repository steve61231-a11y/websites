import type { Metadata } from "next";
import { Suspense } from "react";
import { Welcome } from "./welcome";

export const metadata: Metadata = { title: "You're in" };

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-black" />}>
      <Welcome />
    </Suspense>
  );
}
