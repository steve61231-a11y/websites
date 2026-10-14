import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { normaliseKenyanPhone } from "@/lib/phone";
import { todayEAT } from "./format";
import { openInquiryStatuses, type ApplicationStatus, type InquiryStatus, type InquiryType } from "./labels";

type Db = SupabaseClient<Database>;
type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Strip characters PostgREST treats as syntax in or() filters. */
const safeSearch = (q: string) => q.replace(/[(),.*%:\\]/g, " ").trim().slice(0, 80);

export type InquiryFilters = {
  status: string;
  type: string;
  activity: string;
  county: string;
  assignee: string;
  q: string;
  overdue: boolean;
  view: "list" | "board";
};

export function parseInquiryFilters(p: Params): InquiryFilters {
  return {
    status: one(p.status),
    type: one(p.type),
    activity: one(p.activity),
    county: one(p.county),
    assignee: one(p.assignee),
    q: one(p.q),
    overdue: one(p.overdue) === "1",
    view: one(p.view) === "board" ? "board" : "list",
  };
}

export const inquiryListColumns =
  "id, ref, type, status, contact_name, contact_role, school_name, county, county_other, phone_e164, email, created_at, next_action, next_action_due, assigned_to, source, lost_reason, institution_type, sector, learners_band, grades, preferred_days, preferred_time, start_term, contact_pref, message, utm, inquiry_activities(activities(slug, name)), assignee:profiles!inquiries_assigned_to_fkey(full_name)";

export function inquiryQuery(db: Db, f: InquiryFilters, now: number) {
  let q = db.from("inquiries").select(inquiryListColumns, { count: "exact" });
  if (f.status) q = q.eq("status", f.status as InquiryStatus);
  if (f.type) q = q.eq("type", f.type as InquiryType);
  if (f.county) q = q.eq("county", f.county);
  if (f.assignee === "none") q = q.is("assigned_to", null);
  else if (f.assignee) q = q.eq("assigned_to", f.assignee);
  if (f.overdue) q = q.in("status", openInquiryStatuses).lt("next_action_due", todayEAT(now));
  if (f.activity) {
    q = db
      .from("inquiries")
      .select(inquiryListColumns.replace("inquiry_activities(", "inquiry_activities!inner(").replace("activities(slug", "activities!inner(slug"), { count: "exact" })
      .eq("inquiry_activities.activities.slug", f.activity);
    if (f.status) q = q.eq("status", f.status as InquiryStatus);
    if (f.type) q = q.eq("type", f.type as InquiryType);
    if (f.county) q = q.eq("county", f.county);
    if (f.assignee === "none") q = q.is("assigned_to", null);
    else if (f.assignee) q = q.eq("assigned_to", f.assignee);
    if (f.overdue) q = q.in("status", openInquiryStatuses).lt("next_action_due", todayEAT(now));
  }
  const term = safeSearch(f.q);
  if (term) {
    const phone = normaliseKenyanPhone(term);
    const ors = [`school_name.ilike.%${term}%`, `contact_name.ilike.%${term}%`, `ref.ilike.%${term}%`];
    if (phone) ors.push(`phone_e164.eq.${phone}`);
    else if (/^\d{3,}$/.test(term.replace(/\s/g, ""))) ors.push(`phone_e164.ilike.%${term.replace(/\s/g, "").replace(/^0/, "")}%`);
    q = q.or(ors.join(","));
  }
  return q.order("created_at", { ascending: false });
}

export type ApplicationFilters = { status: string; activity: string; county: string; q: string };

export function parseApplicationFilters(p: Params): ApplicationFilters {
  return { status: one(p.status), activity: one(p.activity), county: one(p.county), q: one(p.q) };
}

export const applicationListColumns =
  "id, ref, status, full_name, phone_e164, email, county, counties, created_at, years_practising, years_coaching, highest_rank, work_preference, availability, first_aid, good_conduct, video_url, source, main_activity_other, main:activities!applications_main_activity_id_fkey(slug, name), vetting_checks(check_type, result)";

export function applicationQuery(db: Db, f: ApplicationFilters) {
  const columns = f.activity
    ? applicationListColumns.replace("main:activities!applications_main_activity_id_fkey(", "main:activities!applications_main_activity_id_fkey!inner(")
    : applicationListColumns;
  let q = db.from("applications").select(columns, { count: "exact" });
  if (f.status) q = q.eq("status", f.status as ApplicationStatus);
  if (f.activity) q = q.eq("main.slug", f.activity);
  if (f.county) q = q.or(`county.eq.${safeSearch(f.county)},counties.cs.{"${safeSearch(f.county)}"}`);
  const term = safeSearch(f.q);
  if (term) {
    const phone = normaliseKenyanPhone(term);
    const ors = [`full_name.ilike.%${term}%`, `ref.ilike.%${term}%`, `email.ilike.%${term}%`, `highest_rank.ilike.%${term}%`];
    if (phone) ors.push(`phone_e164.eq.${phone}`);
    q = q.or(ors.join(","));
  }
  return q.order("created_at", { ascending: false });
}
