"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { updateInquiry } from "@/actions/admin";
import { inquiryStatuses, label, type InquiryStatus } from "@/lib/admin/labels";
import { useToast } from "./Toast";
import { btnSm, inputSm } from "./ui";

type Props = {
  id: string;
  status: InquiryStatus;
  lostReason: string | null;
  nextAction: string | null;
  nextActionDue: string | null;
  assignedTo: string | null;
  team: { id: string; full_name: string }[];
};

/** Status (instant, with undo), next action, due date and assignee (PRD 15). */
export function InquiryControls(props: Props) {
  const router = useRouter();
  const toast = useToast();
  const [, start] = useTransition();
  const [status, setOptimisticStatus] = useOptimistic(props.status);
  const [askLost, setAskLost] = useState(false);
  const [lostReason, setLostReason] = useState(props.lostReason ?? "");
  const [saving, setSaving] = useState(false);

  const changeStatus = (next: InquiryStatus, reason?: string) => {
    const previous = props.status;
    const previousReason = props.lostReason;
    start(async () => {
      setOptimisticStatus(next);
      const res = await updateInquiry({ id: props.id, status: next, ...(next === "lost" ? { lost_reason: reason } : {}) });
      if (!res.ok) {
        toast({ message: res.error, tone: "error" });
        return;
      }
      setAskLost(false);
      router.refresh();
      toast({
        message: `Status: ${label(inquiryStatuses, next)}`,
        undo: async () => {
          const undo = await updateInquiry({
            id: props.id,
            status: previous,
            ...(previous === "lost" ? { lost_reason: previousReason } : {}),
          });
          if (!undo.ok) toast({ message: undo.error, tone: "error" });
          router.refresh();
        },
      });
    });
  };

  return (
    <div className="grid gap-6">
      <div>
        <label htmlFor="inquiry-status" className="mb-2 block font-semibold">
          Status
        </label>
        <select
          id="inquiry-status"
          value={askLost ? "lost" : status}
          onChange={(e) => {
            const next = e.target.value as InquiryStatus;
            if (next === "lost") setAskLost(true);
            else {
              setAskLost(false);
              changeStatus(next);
            }
          }}
          className={`${inputSm} w-full`}
        >
          {inquiryStatuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-[14px] text-text-2">Next: {inquiryStatuses.find((s) => s.value === status)?.hint}</p>
        {askLost && (
          <form
            className="mt-3 grid gap-2 rounded-xl bg-orange-100 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (lostReason.trim()) changeStatus("lost", lostReason.trim());
            }}
          >
            <label htmlFor="lost-reason" className="font-semibold">
              Why was it lost?
            </label>
            <input id="lost-reason" value={lostReason} onChange={(e) => setLostReason(e.target.value)} className={inputSm} required maxLength={500} />
            <div className="flex gap-2">
              <button type="submit" className={`${btnSm} bg-ink-900 text-white`}>
                Mark lost
              </button>
              <button type="button" className={`${btnSm} border border-input-border bg-paper`} onClick={() => setAskLost(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}
        {status === "lost" && props.lostReason && !askLost && <p className="mt-2 text-[14px]">Reason: {props.lostReason}</p>}
      </div>

      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          setSaving(true);
          const res = await updateInquiry({
            id: props.id,
            next_action: String(data.get("next_action") ?? ""),
            next_action_due: String(data.get("next_action_due") ?? ""),
            assigned_to: String(data.get("assigned_to") ?? ""),
          });
          setSaving(false);
          if (!res.ok) toast({ message: res.error, tone: "error" });
          else {
            toast({ message: "Next action saved" });
            router.refresh();
          }
        }}
      >
        <label htmlFor="next-action" className="font-semibold">
          Next action
        </label>
        <input id="next-action" name="next_action" defaultValue={props.nextAction ?? ""} placeholder="e.g. Call to agree a demo date" className={inputSm} maxLength={300} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="next-due" className="mb-1 block text-[14px] text-text-2">
              Due
            </label>
            <input id="next-due" name="next_action_due" type="date" defaultValue={props.nextActionDue ?? ""} className={`${inputSm} w-full`} />
          </div>
          <div>
            <label htmlFor="assignee" className="mb-1 block text-[14px] text-text-2">
              Assigned to
            </label>
            <select id="assignee" name="assigned_to" defaultValue={props.assignedTo ?? ""} className={`${inputSm} w-full`}>
              <option value="">Nobody</option>
              {props.team.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" disabled={saving} className={`${btnSm} justify-self-start bg-green-600 text-white`}>
          Save
        </button>
      </form>
    </div>
  );
}
