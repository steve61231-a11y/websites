import type { ReactNode } from "react";
import { brand } from "@/content/site";

/** Structured data (PRD 16.2). */

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

type Json = Record<string, unknown>;

export function JsonLd({ data }: { data: Json | Json[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped cannot break out of the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function organizationJsonLd(phones: string[], counties: string[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: brand.name,
    url: siteUrl,
    slogan: brand.line,
    telephone: phones,
    areaServed: counties.map((c) => ({ "@type": "AdministrativeArea", name: `${c} County, Kenya` })),
    founder: { "@type": "Person", "@id": `${siteUrl}/about#kennedy`, name: brand.founder },
  };
}

export function personJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}/about#kennedy`,
    name: brand.founder,
    jobTitle: "Founder",
    worksFor: { "@id": `${siteUrl}/#organization` },
    knowsAbout: ["Kenpo Karate", "Fitness science", "First aid", "Leadership"],
  };
}

export function serviceJsonLd(name: string, path: string, counties: string[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${name} for schools`,
    serviceType: "Co-curricular programme",
    url: `${siteUrl}${path}`,
    provider: { "@id": `${siteUrl}/#organization` },
    areaServed: counties.map((c) => ({ "@type": "AdministrativeArea", name: `${c} County, Kenya` })),
  };
}

export function faqJsonLd(items: { q: string; a: ReactNode }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items
      .filter((i) => typeof i.a === "string" && i.a)
      .map((i) => ({
        "@type": "Question",
        name: i.q,
        acceptedAnswer: { "@type": "Answer", text: i.a as string },
      })),
  };
}
