"use client";

import { deleteContent, savePartner, saveTestimonial } from "@/actions/admin";
import { btnSm, inputSm } from "./ui";
import { useSave } from "./useSave";

export type TestimonialRow = {
  id: string; quote: string; author_name: string; author_role: string | null; organisation: string | null;
  permission_confirmed: boolean; published: boolean; sort_order: number;
};
export type PartnerRow = { id: string; name: string; url: string | null; permission_confirmed: boolean; published: boolean; sort_order: number };

const permissionLabel = "I have written permission to publish this";

/** Publishing requires confirmed written permission (PRD 15). */
export function TestimonialEditor({ item }: { item?: TestimonialRow }) {
  const { pending, run } = useSave();
  return (
    <form
      className="grid gap-3 rounded-[16px] border border-hairline bg-paper p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const d = new FormData(form);
        const res = await run(
          () =>
            saveTestimonial({
              id: item?.id ?? "",
              quote: d.get("quote"),
              author_name: d.get("author_name"),
              author_role: d.get("author_role"),
              organisation: d.get("organisation"),
              permission_confirmed: d.get("permission_confirmed") === "on",
              published: d.get("published") === "on",
              sort_order: d.get("sort_order") || 0,
            }),
          item ? "Testimonial saved" : "Testimonial added",
        );
        if (res.ok && !item) form.reset();
      }}
    >
      <p className="font-semibold">{item ? item.author_name : "New testimonial"}</p>
      <label className="grid gap-1">
        <span className="text-[14px] text-text-2">Quote</span>
        <textarea name="quote" rows={3} defaultValue={item?.quote} required maxLength={800} className={`${inputSm} py-2`} />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-[14px] text-text-2">Name</span>
          <input name="author_name" defaultValue={item?.author_name} required className={inputSm} />
        </label>
        <label className="grid gap-1">
          <span className="text-[14px] text-text-2">Role</span>
          <input name="author_role" defaultValue={item?.author_role ?? ""} className={inputSm} />
        </label>
        <label className="grid gap-1">
          <span className="text-[14px] text-text-2">Organisation</span>
          <input name="organisation" defaultValue={item?.organisation ?? ""} className={inputSm} />
        </label>
      </div>
      <Flags permission={item?.permission_confirmed} published={item?.published} order={item?.sort_order} />
      <Actions pending={pending} onDelete={item ? () => run(() => deleteContent({ kind: "testimonials", id: item.id }), "Deleted") : undefined} />
    </form>
  );
}

export function PartnerEditor({ item }: { item?: PartnerRow }) {
  const { pending, run } = useSave();
  return (
    <form
      className="grid gap-3 rounded-[16px] border border-hairline bg-paper p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const d = new FormData(form);
        const res = await run(
          () =>
            savePartner({
              id: item?.id ?? "",
              name: d.get("name"),
              url: d.get("url"),
              permission_confirmed: d.get("permission_confirmed") === "on",
              published: d.get("published") === "on",
              sort_order: d.get("sort_order") || 0,
            }),
          item ? "Partner saved" : "Partner added",
        );
        if (res.ok && !item) form.reset();
      }}
    >
      <p className="font-semibold">{item ? item.name : "New partner"}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-[14px] text-text-2">Name (shown as text)</span>
          <input name="name" defaultValue={item?.name} required className={inputSm} />
        </label>
        <label className="grid gap-1">
          <span className="text-[14px] text-text-2">Website</span>
          <input name="url" type="url" defaultValue={item?.url ?? ""} placeholder="https://" className={inputSm} />
        </label>
      </div>
      <Flags permission={item?.permission_confirmed} published={item?.published} order={item?.sort_order} />
      <Actions pending={pending} onDelete={item ? () => run(() => deleteContent({ kind: "partners", id: item.id }), "Deleted") : undefined} />
    </form>
  );
}

function Flags({ permission, published, order }: { permission?: boolean; published?: boolean; order?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="permission_confirmed" defaultChecked={permission} className="size-5 accent-green-600" />
        {permissionLabel}
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="published" defaultChecked={published} className="size-5 accent-green-600" />
        Published
      </label>
      <label className="flex min-h-11 items-center gap-2">
        Order
        <input name="sort_order" type="number" min={0} max={999} defaultValue={order ?? 0} className={`${inputSm} w-20`} />
      </label>
    </div>
  );
}

function Actions({ pending, onDelete }: { pending: boolean; onDelete?: () => void }) {
  return (
    <div className="flex gap-2">
      <button type="submit" disabled={pending} className={`${btnSm} bg-green-600 text-white`}>
        Save
      </button>
      {onDelete && (
        <button type="button" onClick={onDelete} className={`${btnSm} ml-auto text-orange-700`}>
          Delete
        </button>
      )}
    </div>
  );
}
