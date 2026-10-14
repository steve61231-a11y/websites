"use client";

import { saveSettings } from "@/actions/admin";
import { checkLabels, checkOrder, type CheckType } from "@/lib/admin/labels";
import { formatLocalPhone } from "@/lib/phone";
import { btnSm, inputSm } from "./ui";
import { useSave } from "./useSave";

export type SettingsRow = {
  phones: string[]; whatsapp_e164: string; email: string | null; socials: Record<string, string>; counties: string[];
  response_time_text: string; start_term_options: string[]; required_checks: CheckType[]; email_alerts_enabled: boolean;
  alert_recipients: string[];
};

const socialNames = ["facebook", "instagram", "tiktok", "youtube", "x", "linkedin"];
const lines = (v: FormDataEntryValue | null) => String(v ?? "").split("\n").map((s) => s.trim()).filter(Boolean);

/** Site settings (owner, PRD 15). */
export function SettingsForm({ settings, emailReady }: { settings: SettingsRow; emailReady: boolean }) {
  const { pending, run } = useSave();
  const field = (label: string, input: React.ReactNode, hint?: string) => (
    <label className="grid gap-1">
      <span className="font-semibold">{label}</span>
      {hint && <span className="text-[14px] text-text-2">{hint}</span>}
      {input}
    </label>
  );
  return (
    <form
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        void run(
          () =>
            saveSettings({
              phones: lines(d.get("phones")),
              whatsapp_e164: d.get("whatsapp"),
              email: d.get("email"),
              socials: Object.fromEntries(socialNames.map((n) => [n, String(d.get(`social_${n}`) ?? "").trim()])),
              counties: lines(d.get("counties")),
              response_time_text: d.get("response_time_text"),
              start_term_options: lines(d.get("start_terms")),
              required_checks: d.getAll("required_checks"),
              email_alerts_enabled: d.get("email_alerts_enabled") === "on",
              alert_recipients: lines(d.get("alert_recipients")),
            }),
          "Settings saved. The public site is updated.",
        );
      }}
    >
      <section className="grid gap-4 rounded-[20px] border border-hairline bg-paper p-5">
        <h2 className="text-[19px] font-semibold">Contact</h2>
        {field("Phone numbers", <textarea name="phones" rows={2} defaultValue={settings.phones.map(formatLocalPhone).join("\n")} className={`${inputSm} py-2`} />, "One per line, in display order.")}
        {field("WhatsApp number", <input name="whatsapp" defaultValue={formatLocalPhone(settings.whatsapp_e164)} className={inputSm} />)}
        {field("Email", <input name="email" type="email" defaultValue={settings.email ?? ""} className={inputSm} />, "Shown in the footer and on Contact only when set.")}
        {field("Response time", <input name="response_time_text" defaultValue={settings.response_time_text} className={inputSm} />, "Completes “We'll get back to you within …”.")}
        <fieldset className="grid gap-2">
          <legend className="font-semibold">Social links</legend>
          <span className="text-[14px] text-text-2">Only accounts with a link appear in the footer.</span>
          {socialNames.map((n) => (
            <label key={n} className="grid gap-1 sm:grid-cols-[120px_1fr] sm:items-center">
              <span className="capitalize text-text-2">{n}</span>
              <input name={`social_${n}`} type="url" placeholder="https://" defaultValue={settings.socials[n] ?? ""} className={inputSm} />
            </label>
          ))}
        </fieldset>
      </section>

      <section className="grid gap-4 rounded-[20px] border border-hairline bg-paper p-5">
        <h2 className="text-[19px] font-semibold">Schools</h2>
        {field("Counties served", <textarea name="counties" rows={6} defaultValue={settings.counties.join("\n")} className={`${inputSm} py-2`} />, "One per line. Used on the map, forms and footer.")}
        {field("Start-term options", <textarea name="start_terms" rows={5} defaultValue={settings.start_term_options.join("\n")} className={`${inputSm} py-2`} />, "Choices for “When to start” on the request form.")}
      </section>

      <section className="grid gap-3 rounded-[20px] border border-hairline bg-paper p-5">
        <h2 className="text-[19px] font-semibold">Coach vetting</h2>
        <p className="text-[14px] text-text-2">Approval needs every required check passed (or waived by the owner).</p>
        {checkOrder.map((c) => (
          <label key={c} className="flex min-h-11 items-center gap-2">
            <input type="checkbox" name="required_checks" value={c} defaultChecked={settings.required_checks.includes(c)} className="size-5 accent-green-600" />
            {checkLabels[c]}
          </label>
        ))}
      </section>

      <section className="grid gap-4 rounded-[20px] border border-hairline bg-paper p-5">
        <h2 className="text-[19px] font-semibold">Email alerts</h2>
        {!emailReady && (
          <p className="rounded-xl bg-canvas p-3 text-[14px]">
            Email can&apos;t send yet: the domain and sender (RESEND_API_KEY, EMAIL_FROM) aren&apos;t set up. Until then, the badges and the Overview are the alert.
          </p>
        )}
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="email_alerts_enabled" defaultChecked={settings.email_alerts_enabled} className="size-5 accent-green-600" />
          Email me about each new request and application
        </label>
        {field("Recipients", <textarea name="alert_recipients" rows={2} defaultValue={settings.alert_recipients.join("\n")} className={`${inputSm} py-2`} />, "One email address per line.")}
      </section>

      <button type="submit" disabled={pending} className={`${btnSm} justify-self-start bg-green-600 text-white`}>
        Save settings
      </button>
    </form>
  );
}
