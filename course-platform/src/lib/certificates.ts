import { getCourseById } from "./catalog";
import type { Certificate } from "./demo-store";

// A pre-issued record so the verification page works for anyone viewing the demo.
export const sampleCertificate: Certificate = {
  number: "CERT-2026-PROD-000142",
  courseId: "the-prod",
  name: "Wanjiku Kamau",
  issuedAt: "2026-09-18T10:00:00.000Z",
};

export function lookupCertificate(number: string, mine: Certificate[]) {
  const n = number.trim().toUpperCase();
  const cert = mine.find((c) => c.number === n) ?? (n === sampleCertificate.number ? sampleCertificate : undefined);
  const course = cert && getCourseById(cert.courseId);
  return cert && course ? { cert, course } : undefined;
}
