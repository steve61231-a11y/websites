"use client";

import { Download, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deletePerson } from "@/actions/admin";
import { btnSm, inputSm } from "./ui";

/** Owner-only data-subject tools (PRD 14.5): export JSON and delete. */
export function OwnerTools({ kind, id, refCode }: { kind: "inquiry" | "application"; id: string; refCode: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-3">
      <a href={`/admin/export?kind=${kind}&id=${id}`} className={`${btnSm} justify-self-start border border-input-border bg-paper`}>
        <Download aria-hidden="true" size={18} /> Export this person&apos;s data
      </a>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className={`${btnSm} justify-self-start border border-orange-700 text-orange-700`}>
          <Trash2 aria-hidden="true" size={18} /> Delete this person
        </button>
      ) : (
        <form
          className="grid gap-2 rounded-xl bg-orange-100 p-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await deletePerson({ kind, id });
            if (!res.ok) setError(res.error);
            else router.replace(kind === "inquiry" ? "/admin/inquiries" : "/admin/applications");
          }}
        >
          <label htmlFor="confirm-delete">
            This permanently deletes the record{kind === "application" ? " and its documents" : ""}. Type <strong>{refCode}</strong> to confirm.
          </label>
          <input id="confirm-delete" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputSm} />
          {error && <p className="text-orange-700">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={confirm.trim() !== refCode} className={`${btnSm} bg-orange-700 text-white`}>
              Delete permanently
            </button>
            <button type="button" onClick={() => setOpen(false)} className={`${btnSm} border border-input-border bg-paper`}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
