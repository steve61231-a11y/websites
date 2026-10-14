import type { MetadataRoute } from "next";
import { getActivities } from "@/lib/data/public";
import { siteUrl } from "@/lib/seo";

/** All public routes and programme slugs (PRD 16.2). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const activities = await getActivities();
  const pages = ["", "/programmes", "/schools", "/request", "/join", "/join/apply", "/about", "/contact", "/privacy"];
  return [
    ...pages.map((p) => ({
      url: `${siteUrl}${p}`,
      changeFrequency: "monthly" as const,
      priority: p === "" ? 1 : p === "/request" || p === "/programmes" ? 0.9 : 0.7,
    })),
    ...activities.map((a) => ({
      url: `${siteUrl}/programmes/${a.slug}`,
      changeFrequency: "monthly" as const,
      priority: a.status === "available" ? 0.9 : 0.6,
    })),
  ];
}
