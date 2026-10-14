"use client";

import { useState } from "react";
import { deleteRole, saveRole } from "@/actions/admin";
import { btnSm, inputSm } from "./ui";
import { useSave } from "./useSave";

export type RoleRow = {
  id: string;
  title: string;
  activity_id: string | null;
  counties: string[];
  employment_type: string | null;
  description: string | null;
  is_open: boolean;
  sort_order: number;
};

/** Create, edit, open and close the roles shown on Join (PRD 15). */
export function RoleEditor({
  role,
  activities,
  counties,
  canDelete,
}: {
  role?: RoleRow;
  activities: { id: string; name: string }[];
  counties: string[];
  canDelete: boolean;
}) {
  const { pending, run } = useSave();
  const [open, setOpen] = useState(!role);
  const key = role?.id ?? "new";
  if (role && !open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-hairline bg-paper p-4">
        <div>
          <p className="font-semibold">{role.title}</p>
          <p className="text-[14px] text-text-2">
            {role.is_open ? "Open" : "Closed"}
            {role.employment_type ? ` · ${role.employment_type}` : ""}
            {role.counties.length ? ` · ${role.counties.join(", ")}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={`${btnSm} border border-input-border bg-paper`}
            onClick={() => run(() => saveRole({ ...role, activity_id: role.activity_id ?? "", is_open: !role.is_open }), role.is_open ? "Role closed" : "Role opened")}
            disabled={pending}
          >
            {role.is_open ? "Close" : "Open"}
          </button>
          <button type="button" className={`${btnSm} border border-input-border bg-paper`} onClick={() => setOpen(true)}>
            Edit
          </button>
        </div>
      </div>
    );
  }
  return (
    <form
      className="grid gap-3 rounded-[16px] border border-hairline bg-paper p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        const res = await run(
          () =>
            saveRole({
              id: role?.id ?? "",
              title: d.get("title"),
              activity_id: d.get("activity_id"),
              counties: d.getAll("counties"),
              employment_type: d.get("employment_type"),
              description: d.get("description"),
              is_open: d.get("is_open") === "on",
              sort_order: d.get("sort_order") || 0,
            }),
          role ? "Role saved" : "Role created",
        );
        if (res.ok) {
          if (role) setOpen(false);
          else e.currentTarget?.reset();
        }
      }}
    >
      <p className="font-semibold">{role ? "Edit role" : "New role"}</p>
      <label className="grid gap-1">
        <span className="text-[14px] text-text-2">Title</span>
        <input name="title" defaultValue={role?.title} required minLength={2} maxLength={120} className={inputSm} />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-[14px] text-text-2">Discipline</span>
          <select name="activity_id" defaultValue={role?.activity_id ?? ""} className={inputSm}>
            <option value="">Any</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-[14px] text-text-2">Type</span>
          <input name="employment_type" defaultValue={role?.employment_type ?? ""} placeholder="Part-time" maxLength={60} className={inputSm} />
        </label>
        <label className="grid gap-1">
          <span className="text-[14px] text-text-2">Order</span>
          <input name="sort_order" type="number" min={0} max={999} defaultValue={role?.sort_order ?? 0} className={inputSm} />
        </label>
      </div>
      <fieldset>
        <legend className="mb-1 text-[14px] text-text-2">Counties</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {counties.map((c) => (
            <label key={c} className="flex min-h-11 items-center gap-2">
              <input type="checkbox" name="counties" value={c} defaultChecked={role?.counties.includes(c)} className="size-5 accent-green-600" />
              {c}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="grid gap-1">
        <span className="text-[14px] text-text-2">Short description</span>
        <textarea name="description" rows={3} defaultValue={role?.description ?? ""} maxLength={1000} className={`${inputSm} py-2`} />
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="is_open" defaultChecked={role?.is_open ?? true} className="size-5 accent-green-600" id={`open-${key}`} />
        Open (shown on Join)
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={`${btnSm} bg-green-600 text-white`}>
          {role ? "Save" : "Create role"}
        </button>
        {role && (
          <button type="button" onClick={() => setOpen(false)} className={`${btnSm} border border-input-border bg-paper`}>
            Cancel
          </button>
        )}
        {role && canDelete && (
          <button
            type="button"
            onClick={() => run(() => deleteRole(role.id), "Role deleted")}
            className={`${btnSm} ml-auto text-orange-700`}
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
