import type { Metadata } from "next";
import { EnrollFlow } from "./enroll-flow";

export const metadata: Metadata = { title: "Get access" };

export default function EnrollPage() {
  return <EnrollFlow />;
}
