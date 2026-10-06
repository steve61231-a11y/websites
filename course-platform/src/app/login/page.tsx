import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginFlow } from "./login-flow";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginFlow />
    </Suspense>
  );
}
