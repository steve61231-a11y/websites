"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useRef, useTransition } from "react";
import { addNote } from "@/actions/admin";
import { useToast } from "./Toast";
import { btnSm, inputSm } from "./ui";

export type TimelineItem = { id: string; kind: "note" | "event"; at: string; when: string; who: string; text: string };

/** Notes and history in one timeline (PRD 15). Notes save instantly. */
export function Notes({ entityType, entityId, items }: { entityType: "inquiry" | "application"; entityId: string; items: TimelineItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const form = useRef<HTMLFormElement>(null);
  const [, start] = useTransition();
  const [optimistic, addOptimistic] = useOptimistic(items, (list, item: TimelineItem) => [item, ...list]);

  return (
    <div>
      <form
        ref={form}
        className="grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const body = String(new FormData(e.currentTarget).get("body") ?? "").trim();
          if (!body) return;
          form.current?.reset();
          start(async () => {
            addOptimistic({ id: `tmp-${Date.now()}`, kind: "note", at: new Date().toISOString(), when: "now", who: "You", text: body });
            const res = await addNote({ entityType, entityId, body });
            if (!res.ok) toast({ message: res.error, tone: "error" });
            else toast({ message: "Note added" });
            router.refresh();
          });
        }}
      >
        <label htmlFor="note-body" className="font-semibold">
          Add a note
        </label>
        <textarea id="note-body" name="body" rows={3} maxLength={5000} className={`${inputSm} py-2`} />
        <button type="submit" className={`${btnSm} justify-self-start bg-ink-900 text-white`}>
          Add note
        </button>
      </form>
      <ol className="mt-6 flex flex-col gap-4 border-l border-hairline pl-4">
        {optimistic.map((i) => (
          <li key={i.id} className="relative">
            <span aria-hidden="true" className={`absolute top-1.5 -left-[21px] size-2.5 rounded-full ${i.kind === "note" ? "bg-green-600" : "bg-input-border"}`} />
            <p className={i.kind === "note" ? "whitespace-pre-line" : "text-[15px] text-text-2"}>{i.text}</p>
            <p className="mt-0.5 text-[13px] text-text-3">
              {i.who} · {i.when}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
