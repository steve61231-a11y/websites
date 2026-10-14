"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { recordCheck } from "@/actions/admin";
import { checkLabels, checkResults, label, type CheckResult, type CheckType } from "@/lib/admin/labels";
import { useToast } from "./Toast";
import { btnSm, inputSm } from "./ui";

export type Check = { type: CheckType; result: CheckResult; note: string | null; required: boolean; recordedBy: string | null; recordedAt: string | null };

/** Vetting checklist (PRD 5): result, who, when and a note per check. */
export function VettingChecklist({ applicationId, checks, isOwner }: { applicationId: string; checks: Check[]; isOwner: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [, start] = useTransition();
  const [state, setOptimistic] = useOptimistic(checks, (list, next: { type: CheckType; result: CheckResult }) =>
    list.map((c) => (c.type === next.type ? { ...c, result: next.result } : c)),
  );
  const [editing, setEditing] = useState<{ type: CheckType; result: CheckResult } | null>(null);

  const save = (c: Check, result: CheckResult, note: string | null) => {
    start(async () => {
      setOptimistic({ type: c.type, result });
      const res = await recordCheck({ applicationId, checkType: c.type, result, note });
      if (!res.ok) {
        toast({ message: res.error, tone: "error" });
        router.refresh();
        return;
      }
      setEditing(null);
      router.refresh();
      toast({
        message: `${checkLabels[c.type]}: ${label(checkResults, result)}`,
        undo: async () => {
          const undo = await recordCheck({ applicationId, checkType: c.type, result: c.result, note: c.note });
          if (!undo.ok) toast({ message: undo.error, tone: "error" });
          router.refresh();
        },
      });
    });
  };

  return (
    <ul className="grid gap-4">
      {state.map((c) => (
        <li key={c.type} className="rounded-[16px] border border-hairline p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold">
              {checkLabels[c.type]} {c.required ? <span className="text-[13px] font-normal text-text-2">(required)</span> : <span className="text-[13px] font-normal text-text-2">(desirable)</span>}
            </p>
            <label className="sr-only" htmlFor={`check-${c.type}`}>
              Result for {checkLabels[c.type]}
            </label>
            <select
              id={`check-${c.type}`}
              value={c.result}
              onChange={(e) => {
                const result = e.target.value as CheckResult;
                if (result === "waived") setEditing({ type: c.type, result });
                else save(c, result, c.note);
              }}
              className={inputSm}
            >
              {checkResults
                .filter((r) => r.value !== "waived" || isOwner || c.result === "waived")
                .map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
            </select>
          </div>
          {c.recordedAt && (
            <p className="mt-1 text-[13px] text-text-3">
              {c.recordedBy ?? "Staff"} · {new Date(c.recordedAt).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" })}
            </p>
          )}
          {c.note && editing?.type !== c.type && <p className="mt-2 text-[15px] whitespace-pre-line">{c.note}</p>}
          {editing?.type === c.type ? (
            <form
              className="mt-3 grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const note = String(new FormData(e.currentTarget).get("note") ?? "").trim() || null;
                save(c, editing.result, note);
              }}
            >
              <label htmlFor={`note-${c.type}`} className="text-[14px] font-semibold">
                {editing.result === "waived" ? "Why is this check waived? (required)" : "Note"}
              </label>
              <textarea id={`note-${c.type}`} name="note" rows={2} required={editing.result === "waived"} defaultValue={c.note ?? ""} maxLength={1000} className={`${inputSm} py-2`} />
              <div className="flex gap-2">
                <button type="submit" className={`${btnSm} bg-ink-900 text-white`}>
                  Save
                </button>
                <button type="button" onClick={() => setEditing(null)} className={`${btnSm} border border-input-border bg-paper`}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => setEditing({ type: c.type, result: c.result })} className="mt-2 min-h-11 text-[14px] font-semibold text-green-700">
              {c.note ? "Edit note" : "Add a note"}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
