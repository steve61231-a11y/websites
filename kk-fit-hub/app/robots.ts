import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

/** Admin is never crawled (PRD 16.2). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
