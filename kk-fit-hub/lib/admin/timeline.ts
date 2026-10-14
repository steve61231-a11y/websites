import "server-only";
import type { Staff } from "./dal";
import { formatDateTime } from "./format";
import { applicationStatuses, checkLabels, checkResults, inquiryStatuses, label, type CheckType } from "./labels";
import type { TimelineItem } from "@/components/admin/Notes";

const fieldNames: Record<string, string> = {
  next_action: "Next action",
  next_action_due: "Due date",
  assigned_to: "Assignee",
  lost_reason: "Lost reason",
  decline_reason: "Decline reason",
  delete_after: "Retention date",
  details_added_at: "Details added",
};

/** Notes plus the audit trail for one record, newest first. */
export async function loadTimeline(staff: Staff, kind: "inquiry" | "application", id: string): Promise<TimelineItem[]> {
  const [notes, log, people] = await Promise.all([
    staff.db.from("notes").select("id, body, created_at, author_id").eq("entity_type", kind).eq("entity_id", id),
    staff.db.from("activity_log").select("id, action, from_value, to_value, created_at, actor_id").eq("entity_id", id).neq("action", "note_added"),
    staff.db.from("profiles").select("id, full_name"),
  ]);
  const name = (pid: string | null) => (pid ? (people.data ?? []).find((p) => p.id === pid)?.full_name ?? "Staff" : "Website");
  const describe = (action: string, from: string | null, to: string | null): string => {
    if (action === "created") return kind === "inquiry" ? "Request received" : "Application received";
    if (action === "status") {
      const list = kind === "inquiry" ? inquiryStatuses : applicationStatuses;
      return `Status: ${label(list as { value: string; label: string }[], from)} → ${label(list as { value: string; label: string }[], to)}`;
    }
    if (action.startsWith("check:")) {
      const t = action.slice(6) as CheckType;
      return `${checkLabels[t] ?? t}: ${label(checkResults, to as never)}`;
    }
    if (action === "assigned_to") return `Assignee: ${to ? name(to) : "nobody"}`;
    return `${fieldNames[action] ?? action}: ${to ?? "cleared"}`;
  };
  const items: TimelineItem[] = [
    ...(notes.data ?? []).map((n) => ({ id: n.id, kind: "note" as const, at: n.created_at, when: formatDateTime(n.created_at), who: name(n.author_id), text: n.body })),
    ...(log.data ?? []).map((l) => ({
      id: l.id,
      kind: "event" as const,
      at: l.created_at,
      when: formatDateTime(l.created_at),
      who: name(l.actor_id),
      text: describe(l.action, l.from_value, l.to_value),
    })),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at));
}
