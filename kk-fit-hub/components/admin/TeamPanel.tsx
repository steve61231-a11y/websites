"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import { inviteStaff, updateMember } from "@/actions/admin";
import { WhatsAppIcon } from "@/components/site/icons";
import { btnSm, inputSm } from "./ui";
import { useSave } from "./useSave";

export type Member = { id: string; full_name: string; email: string | null; role: "owner" | "staff"; active: boolean; mfa: boolean; self: boolean };

/** Invite staff, set role, deactivate; shows two-factor status (PRD 15). */
export function TeamPanel({ members }: { members: Member[] }) {
  const { pending, run } = useSave();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid gap-8">
      <form
        className="grid gap-3 rounded-[20px] border border-hairline bg-paper p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const d = new FormData(form);
          const res = await run(() => inviteStaff({ fullName: d.get("full_name"), email: d.get("email"), role: d.get("role") }), "Invite created");
          if (res.ok && res.data?.link) {
            setLink(res.data.link);
            form.reset();
          }
        }}
      >
        <h2 className="text-[19px] font-semibold">Invite someone</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px]">
          <label className="grid gap-1">
            <span className="text-[14px] text-text-2">Full name</span>
            <input name="full_name" required minLength={2} className={inputSm} />
          </label>
          <label className="grid gap-1">
            <span className="text-[14px] text-text-2">Email</span>
            <input name="email" type="email" required className={inputSm} />
          </label>
          <label className="grid gap-1">
            <span className="text-[14px] text-text-2">Role</span>
            <select name="role" defaultValue="staff" className={inputSm}>
              <option value="staff">Staff</option>
              <option value="owner">Owner</option>
            </select>
          </label>
        </div>
        <button type="submit" disabled={pending} className={`${btnSm} justify-self-start bg-green-600 text-white`}>
          Create invite link
        </button>
        {link && (
          <div className="grid gap-2 rounded-xl bg-green-100 p-3">
            <p className="text-[14px]">Send this one-time link to them. It signs them in to choose a password.</p>
            <code className="block text-[13px] break-all" data-invite-link>
              {link}
            </code>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`${btnSm} border border-input-border bg-paper`}
                onClick={async () => {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                }}
              >
                <Copy aria-hidden="true" size={16} /> {copied ? "Copied" : "Copy link"}
              </button>
              <a
                className={`${btnSm} border border-input-border bg-paper`}
                href={`https://wa.me/?text=${encodeURIComponent(`Your KK Fit Hub admin invite: ${link}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon size={16} /> Send on WhatsApp
              </a>
            </div>
          </div>
        )}
      </form>

      <ul className="grid gap-2">
        {members.map((m) => (
          <li key={m.id} className="flex flex-col gap-3 rounded-[16px] border border-hairline bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">
                {m.full_name} {m.self && <span className="font-normal text-text-2">(you)</span>}
              </p>
              <p className="text-[14px] text-text-2">
                {m.email} · {m.active ? "Active" : "Deactivated"} · Two-factor {m.mfa ? "on" : "off"}
              </p>
            </div>
            {!m.self && (
              <div className="flex flex-wrap gap-2">
                <label className="sr-only" htmlFor={`role-${m.id}`}>
                  Role for {m.full_name}
                </label>
                <select
                  id={`role-${m.id}`}
                  defaultValue={m.role}
                  onChange={(e) => run(() => updateMember({ id: m.id, role: e.target.value }), "Role updated")}
                  className={inputSm}
                >
                  <option value="staff">Staff</option>
                  <option value="owner">Owner</option>
                </select>
                <button
                  type="button"
                  onClick={() => run(() => updateMember({ id: m.id, active: !m.active }), m.active ? "Deactivated" : "Reactivated")}
                  className={`${btnSm} border border-input-border bg-paper`}
                >
                  {m.active ? "Deactivate" : "Reactivate"}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
