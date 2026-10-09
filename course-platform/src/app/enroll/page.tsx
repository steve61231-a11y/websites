import type { Metadata } from "next";
import { EnrollFlow } from "./enroll-flow";
import { PageTransition } from "@/components/motion/page";

export const metadata: Metadata = { title: "Get access" };

export default function EnrollPage() {
  return (
    <PageTransition>
      <EnrollFlow />
    </PageTransition>
  );
}
