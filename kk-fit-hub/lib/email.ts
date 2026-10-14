import "server-only";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/seo";

/**
 * Email alerts for new submissions (PRD 15). Off until the domain is
 * verified: requires RESEND_API_KEY, EMAIL_FROM and, in Settings, email
 * alerts switched on with at least one recipient. No documents are attached.
 */
export type Alert = {
  kind: "inquiry" | "application";
  id: string;
  ref: string;
  title: string;
  lines: [label: string, value: string | null | undefined][];
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendAlert(alert: Alert): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return;

  const db = createServiceClient();
  const { data: settings } = await db
    .from("site_settings")
    .select("email_alerts_enabled, alert_recipients")
    .limit(1)
    .maybeSingle();
  if (!settings?.email_alerts_enabled || settings.alert_recipients.length === 0) return;

  const path = alert.kind === "inquiry" ? `/admin/inquiries/${alert.id}` : `/admin/applications/${alert.id}`;
  const link = `${siteUrl}${path}`;
  const rows = alert.lines.filter(([, v]) => v);
  const text = [`${alert.title} (${alert.ref})`, "", ...rows.map(([k, v]) => `${k}: ${v}`), "", `Open: ${link}`].join("\n");
  const html = `<h2 style="font-family:system-ui,sans-serif">${escapeHtml(alert.title)} · ${escapeHtml(alert.ref)}</h2>
<table style="font-family:system-ui,sans-serif;font-size:15px">${rows
    .map(([k, v]) => `<tr><td style="color:#6e6e73;padding:4px 16px 4px 0">${escapeHtml(k)}</td><td>${escapeHtml(v ?? "")}</td></tr>`)
    .join("")}</table>
<p style="font-family:system-ui,sans-serif"><a href="${link}">Open in the admin</a></p>`;

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: settings.alert_recipients,
      subject: `${alert.title}: ${alert.ref}`,
      text,
      html,
    });
    if (error) console.error("Alert email failed", error.message);
  } catch (error) {
    console.error("Alert email failed", error);
  }
}
