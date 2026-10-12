import type { Metadata } from "next";
import { EnrollFlow } from "../enroll/enroll-flow";
import { PageTransition } from "@/components/motion/page";

export const metadata: Metadata = { title: "Book a 1:1 session" };

export default function BookPage() {
  return (
    <PageTransition>
      <EnrollFlow mode="session" />
    </PageTransition>
  );
}
