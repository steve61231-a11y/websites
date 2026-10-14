"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { updateApplicationStatus } from "@/actions/admin";
import { applicationStatuses, label, type ApplicationStatus } from "@/lib/admin/labels";
import { useToast } from "./Toast";
import { btnSm, inputSm } from "./ui";

/**
 * Pipeline status, plus Approve (owner only, disabled with the reason shown
 * until every required check has passed) and Decline with a reason (PRD 15).
 * The database trigger enforces the same rules.
 */
export function ApplicationDecision({
  id,
  status,
  isOwner,
  blockers,
}: {
  id: string;
  status: ApplicationStatus;
  isOwner: boolean;
  blockers: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [, start] = useTransition();
  const [current, setOptimistic] = useOptimistic(status);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const decided = status === "approved" || status === "declined";

  const change = (next: ApplicationStatus, declineReason?: string) =>
    start(async () => {
      setOptimistic(next);
      const res = await updateApplicationStatus({ id, status: next, decline_reason: declineReason });
      if (!res.ok) {
        toast({ message: res.error, tone: "error" });
        router.refresh();
        return;
      }
      setDeclining(false);
      router.refresh();
      const canUndo = !(decided && !isOwner);
      toast({
        message: `Status: ${label(applicationStatuses, next)}`,
        undo: canUndo
          ? async () => {
              const undo = await updateApplicationStatus({ id, status });
              if (!undo.ok) toast({ message: undo.error, tone: "error" });
              router.refresh();
            }
          : undefined,
      });
    });

  const pipeline = applicationStatuses.filter((s) => s.value !== "approved" && s.value !== "declined");
  const approveReason = !isOwner
    ? "Only the owner can approve."
    : blockers.length > 0
      ? `Waiting on: ${blockers.join(", ")}.`
      : null;

  return (
    <div className="grid gap-5">
      <div>
        <label htmlFor="app-status" className="mb-2 block font-semibold">
          Status
        </label>
        {decided && !isOwner ? (
          <p>{label(applicationStatuses, current)} (decided by the owner)</p>
        ) : (
          <select
            id="app-status"
            value={current}
            onChange={(e) => change(e.target.value as ApplicationStatus)}
            className={`${inputSm} w-full`}
          >
            {(decided ? applicationStatuses.filter((s) => s.value === current).concat(pipeline) : pipeline).map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {current !== "approved" && (
        <div>
          <button
            type="button"
            onClick={() => change("approved")}
            disabled={approveReason !== null}
            aria-describedby="approve-reason"
            className={`${btnSm} w-full bg-green-600 text-white`}
          >
            Approve
          </button>
          {approveReason && (
            <p id="approve-reason" className="mt-2 text-[14px] text-text-2">
              {approveReason}
            </p>
          )}
        </div>
      )}

      {isOwner && current !== "declined" && (
        <div>
          {!declining ? (
            <button type="button" onClick={() => setDeclining(true)} className={`${btnSm} w-full border border-input-border bg-paper`}>
              Decline
            </button>
          ) : (
            <form
              className="grid gap-2 rounded-xl bg-canvas p-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (reason.trim()) change("declined", reason.trim());
              }}
            >
              <label htmlFor="decline-reason" className="font-semibold">
                Reason for declining
              </label>
              <input id="decline-reason" value={reason} onChange={(e) => setReason(e.target.value)} required maxLength={500} className={inputSm} />
              <div className="flex gap-2">
                <button type="submit" className={`${btnSm} bg-ink-900 text-white`}>
                  Decline
                </button>
                <button type="button" onClick={() => setDeclining(false)} className={`${btnSm} border border-input-border bg-paper`}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
