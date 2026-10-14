"use client";

import { saveActivity } from "@/actions/admin";
import { btnSm, inputSm } from "./ui";
import { useSave } from "./useSave";

export type ActivityRow = {
  id: string;
  slug: string;
  name: string;
  one_liner: string;
  description: string | null;
  outcomes: string[];
  age_range: string | null;
  status: "available" | "soon" | "hidden";
  recruiting: boolean;
  sort_order: number;
};

/** Owner edits an activity; saving refreshes the public pages (PRD 15). */
export function ActivityEditor({ activity }: { activity: ActivityRow }) {
  const { pending, run } = useSave();
  return (
    <details className="group rounded-[16px] border border-hairline bg-paper">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 [&::-webkit-details-marker]:hidden">
        <span className="font-semibold">{activity.name}</span>
        <span className="text-[14px] text-text-2">
          {activity.status === "available" ? "Available now" : activity.status === "soon" ? "Launching soon" : "Hidden"}
          {activity.recruiting ? " · Recruiting" : ""}
        </span>
      </summary>
      <form
        className="grid gap-3 border-t border-hairline p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          void run(
            () =>
              saveActivity({
                id: activity.id,
                name: d.get("name"),
                one_liner: d.get("one_liner"),
                description: d.get("description"),
                outcomes: String(d.get("outcomes") ?? "")
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
                age_range: d.get("age_range"),
                status: d.get("status"),
                recruiting: d.get("recruiting") === "on",
                sort_order: d.get("sort_order"),
              }),
            `${activity.name} saved. The public site is updated.`,
          );
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-[14px] text-text-2">Name</span>
            <input name="name" defaultValue={activity.name} required className={inputSm} />
          </label>
          <label className="grid gap-1">
            <span className="text-[14px] text-text-2">Status</span>
            <select name="status" defaultValue={activity.status} className={inputSm}>
              <option value="available">Available now</option>
              <option value="soon">Launching soon</option>
              <option value="hidden">Hidden</option>
            </select>
          </label>
        </div>
        <label className="grid gap-1">
          <span className="text-[14px] text-text-2">One-liner</span>
          <input name="one_liner" defaultValue={activity.one_liner} required maxLength={160} className={inputSm} />
        </label>
        <label className="grid gap-1">
          <span className="text-[14px] text-text-2">Description</span>
          <textarea name="description" rows={3} defaultValue={activity.description ?? ""} maxLength={2000} className={`${inputSm} py-2`} />
        </label>
        <label className="grid gap-1">
          <span className="text-[14px] text-text-2">Outcomes (one per line)</span>
          <textarea name="outcomes" rows={4} defaultValue={activity.outcomes.join("\n")} className={`${inputSm} py-2`} />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1">
            <span className="text-[14px] text-text-2">Age range</span>
            <input name="age_range" defaultValue={activity.age_range ?? ""} maxLength={80} className={inputSm} />
          </label>
          <label className="grid gap-1">
            <span className="text-[14px] text-text-2">Order</span>
            <input name="sort_order" type="number" min={0} max={999} defaultValue={activity.sort_order} className={inputSm} />
          </label>
          <label className="flex min-h-11 items-center gap-2 self-end">
            <input type="checkbox" name="recruiting" defaultChecked={activity.recruiting} className="size-5 accent-green-600" />
            Recruiting coaches
          </label>
        </div>
        <button type="submit" disabled={pending} className={`${btnSm} justify-self-start bg-green-600 text-white`}>
          Save
        </button>
      </form>
    </details>
  );
}
