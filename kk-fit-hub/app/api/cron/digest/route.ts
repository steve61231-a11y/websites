import { connection } from "next/server";
import { Resend } from "resend";
import { todayEAT } from "@/lib/admin/format";
import { openInquiryStatuses } from "@/lib/admin/labels";
import { isCronRequest } from "@/lib/jobs/auth";
import { siteUrl } from "@/lib/seo";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";

/** Optional morning digest at 07:45 East Africa Time (PRD 15): overdue
 * follow-ups and new items since yesterday. Sends only when email alerts are on. */
export async function GET(request: Request) {
  await connection();
  if (!isCronRequest(request)) return new Response("Unauthorised", { status: 401 });
  if (!hasServiceRole() || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return Response.json({ skipped: "email not configured" });
  }
  const db = createServiceClient();
  const { data: settings } = await db.from("site_settings").select("email_alerts_enabled, alert_recipients").limit(1).maybeSingle();
  if (!settings?.email_alerts_enabled || settings.alert_recipients.length === 0) return Response.json({ skipped: "alerts off" });

  const now = Date.now();
  const since = new Date(now - 24 * 3600_000).toISOString();
  const [overdue, requests, applications] = await Promise.all([
    db.from("inquiries").select("ref, school_name, contact_name, next_action, next_action_due").in("status", openInquiryStatuses).lt("next_action_due", todayEAT(now)).order("next_action_due"),
    db.from("inquiries").select("ref, school_name, contact_name, type").gte("created_at", since),
    db.from("applications").select("ref, full_name").gte("created_at", since),
  ]);
  const lines = [
    `Overdue follow-ups: ${overdue.data?.length ?? 0}`,
    ...(overdue.data ?? []).map((i) => `  ${i.ref} ${i.school_name ?? i.contact_name}: ${i.next_action ?? "follow up"} (due ${i.next_action_due})`),
    "",
    `New requests since yesterday: ${requests.data?.length ?? 0}`,
    ...(requests.data ?? []).map((i) => `  ${i.ref} ${i.school_name ?? i.contact_name} (${i.type})`),
    "",
    `New applications since yesterday: ${applications.data?.length ?? 0}`,
    ...(applications.data ?? []).map((a) => `  ${a.ref} ${a.full_name}`),
    "",
    `Open the admin: ${siteUrl}/admin`,
  ];
  if ((overdue.data?.length ?? 0) + (requests.data?.length ?? 0) + (applications.data?.length ?? 0) === 0) {
    return Response.json({ skipped: "nothing to report" });
  }
  await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.EMAIL_FROM,
    to: settings.alert_recipients,
    subject: "KK Fit Hub: this morning",
    text: lines.join("\n"),
  });
  return Response.json({ sent: true });
}
