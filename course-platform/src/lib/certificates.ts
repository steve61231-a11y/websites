import { backendOn } from "./backend";
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
  const cert = mine.find((c) => c.number === n) ?? (!backendOn && n === sampleCertificate.number ? sampleCertificate : undefined);
  const course = cert && getCourseById(cert.courseId);
  return cert && course ? { cert, course } : undefined;
}

export type Found = NonNullable<ReturnType<typeof lookupCertificate>>;

/** Finds a certificate: the student's own first, then (with the backend on) the public record on the server. */
export async function findCertificate(number: string, mine: Certificate[]): Promise<Found | undefined> {
  const local = lookupCertificate(number, mine);
  if (local || !backendOn) return local;
  try {
    const res = await fetch(`/api/certificate/verify?number=${encodeURIComponent(number.trim())}`);
    const d = (await res.json()) as { valid?: boolean; number: string; name: string; courseId: string; issuedAt: string };
    const course = d.valid ? getCourseById(d.courseId) : undefined;
    return course ? { cert: { number: d.number, courseId: d.courseId, name: d.name, issuedAt: d.issuedAt }, course } : undefined;
  } catch {
    return undefined;
  }
}
