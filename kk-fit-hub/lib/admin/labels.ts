import type { Database } from "@/lib/supabase/database.types";

export type InquiryStatus = Database["public"]["Enums"]["inquiry_status"];
export type ApplicationStatus = Database["public"]["Enums"]["application_status"];
export type CheckType = Database["public"]["Enums"]["check_type"];
export type CheckResult = Database["public"]["Enums"]["check_result"];
export type InquiryType = Database["public"]["Enums"]["inquiry_type"];

/** Pipelines (PRD 5). */
export const inquiryStatuses: { value: InquiryStatus; label: string; hint: string }[] = [
  { value: "new", label: "New", hint: "Call or WhatsApp within the promised time" },
  { value: "contacted", label: "Contacted", hint: "Agree a demonstration date" },
  { value: "demo_scheduled", label: "Demo scheduled", hint: "Deliver the demonstration" },
  { value: "proposal_sent", label: "Proposal sent", hint: "Follow up the decision" },
  { value: "won", label: "Won", hint: "Hand over to delivery" },
  { value: "lost", label: "Lost", hint: "Record the reason" },
  { value: "closed", label: "Closed", hint: "Spam, duplicate or not relevant" },
];
export const openInquiryStatuses: InquiryStatus[] = ["new", "contacted", "demo_scheduled", "proposal_sent"];

export const applicationStatuses: { value: ApplicationStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "in_vetting", label: "In vetting" },
  { value: "approved", label: "Approved" },
  { value: "on_hold", label: "On hold" },
  { value: "declined", label: "Declined" },
];

export const inquiryTypes: { value: InquiryType; label: string }[] = [
  { value: "demo", label: "Demonstration" },
  { value: "interest", label: "Interest" },
  { value: "general", label: "Message" },
];

export const checkLabels: Record<CheckType, string> = {
  interview: "Interview",
  live_demo: "Live skill demonstration",
  good_conduct: "Certificate of Good Conduct (DCI)",
  references: "Two references",
  first_aid: "First aid certificate",
};
export const checkOrder: CheckType[] = ["interview", "live_demo", "good_conduct", "references", "first_aid"];

export const checkResults: { value: CheckResult; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
  { value: "waived", label: "Waived" },
];

export const label = <T extends string>(list: { value: T; label: string }[], v: T | null | undefined) =>
  list.find((x) => x.value === v)?.label ?? v ?? "";

export const firstAidLabel: Record<string, string> = { current: "Current", expired: "Expired", none: "None" };
export const goodConductLabel: Record<string, string> = {
  current: "Has a current one",
  can_get: "Can get one",
  need_help: "Would need help",
};
