import { cacheLife, cacheTag } from "next/cache";
import { seedActivities, type Activity, type GlyphId } from "@/content/activities";
import { defaultSettings, type PublicSettings } from "@/content/site";
import { hasSupabase } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Cached public reads (PRD 12, loading strategy 1). Pages render statically
 * and are refreshed on demand when an admin saves (updateTag on these tags).
 * Until Supabase is configured, typed seed content is used.
 */
export const tags = {
  activities: "activities",
  roles: "open-roles",
  settings: "settings",
  testimonials: "testimonials",
  partners: "partners",
} as const;

const glyphs: GlyphId[] = ["karate", "chess", "skating", "ballet", "dance", "music", "coding"];

export async function getActivities(): Promise<Activity[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.activities);
  if (!hasSupabase()) return seedActivities;

  const { data, error } = await createPublicClient()
    .from("activities")
    .select("id, slug, name, one_liner, description, outcomes, age_range, status, recruiting, glyph, sort_order")
    .neq("status", "hidden")
    .order("sort_order");
  if (error || !data) {
    console.error("getActivities failed", error?.message);
    return seedActivities;
  }
  return data.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    oneLiner: a.one_liner,
    description: a.description,
    outcomes: a.outcomes,
    ageRange: a.age_range,
    status: a.status,
    recruiting: a.recruiting,
    glyph: glyphs.includes(a.glyph as GlyphId) ? (a.glyph as GlyphId) : "karate",
    sortOrder: a.sort_order,
  }));
}

export async function getActivity(slug: string): Promise<Activity | null> {
  const all = await getActivities();
  return all.find((a) => a.slug === slug) ?? null;
}

export type OpenRole = {
  id: string;
  title: string;
  activityName: string | null;
  activitySlug: string | null;
  counties: string[];
  employmentType: string | null;
  description: string | null;
};

export async function getOpenRoles(): Promise<OpenRole[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.roles);
  if (!hasSupabase()) return [];

  const { data, error } = await createPublicClient()
    .from("open_roles")
    .select("id, title, counties, employment_type, description, activities(name, slug)")
    .eq("is_open", true)
    .order("sort_order");
  if (error || !data) {
    console.error("getOpenRoles failed", error?.message);
    return [];
  }
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    activityName: r.activities?.name ?? null,
    activitySlug: r.activities?.slug ?? null,
    counties: r.counties,
    employmentType: r.employment_type,
    description: r.description,
  }));
}

export async function getSettings(): Promise<PublicSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.settings);
  if (!hasSupabase()) return defaultSettings;

  const { data, error } = await createPublicClient().from("public_settings").select("*").limit(1).maybeSingle();
  if (error || !data) {
    console.error("getSettings failed", error?.message);
    return defaultSettings;
  }
  const socials =
    data.socials && typeof data.socials === "object" && !Array.isArray(data.socials)
      ? Object.fromEntries(
          Object.entries(data.socials).filter((e): e is [string, string] => typeof e[1] === "string" && e[1] !== ""),
        )
      : {};
  return {
    phones: data.phones?.length ? data.phones : defaultSettings.phones,
    whatsappE164: data.whatsapp_e164 ?? defaultSettings.whatsappE164,
    email: data.email ?? null,
    socials,
    counties: data.counties?.length ? data.counties : defaultSettings.counties,
    responseTimeText: data.response_time_text ?? defaultSettings.responseTimeText,
    startTermOptions: data.start_term_options?.length ? data.start_term_options : defaultSettings.startTermOptions,
  };
}

export type Testimonial = {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string | null;
  organisation: string | null;
};

export async function getTestimonials(): Promise<Testimonial[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.testimonials);
  if (!hasSupabase()) return [];
  const { data } = await createPublicClient()
    .from("testimonials")
    .select("id, quote, author_name, author_role, organisation")
    .eq("published", true)
    .eq("permission_confirmed", true)
    .order("sort_order");
  return (data ?? []).map((t) => ({
    id: t.id,
    quote: t.quote,
    authorName: t.author_name,
    authorRole: t.author_role,
    organisation: t.organisation,
  }));
}

export type Partner = { id: string; name: string; url: string | null };

export async function getPartners(): Promise<Partner[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.partners);
  if (!hasSupabase()) return [];
  const { data } = await createPublicClient()
    .from("partners")
    .select("id, name, url")
    .eq("published", true)
    .eq("permission_confirmed", true)
    .order("sort_order");
  return (data ?? []).map((p) => ({ id: p.id, name: p.name, url: p.url }));
}
