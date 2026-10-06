"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { photographyCourse } from "@/lib/catalog";
import { demo, useDemo } from "@/lib/demo-store";

export function Profile() {
  const { user } = useDemo();
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);
  const course = photographyCourse;

  return (
    <div className="wrap max-w-[680px] pt-10 sm:pt-14">
      <h1 className="display text-[clamp(34px,5vw,48px)]">Profile.</h1>

      <section className="mt-10 overflow-hidden rounded-[20px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <form
          className="border-b border-line p-5"
          onSubmit={(e) => {
            e.preventDefault();
            demo.updateName(name.trim());
            setSaved(true);
            setTimeout(() => setSaved(false), 1600);
          }}
        >
          <label className="text-[13px] text-muted" htmlFor="name">Name on certificates</label>
          <div className="mt-1.5 flex gap-2">
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn btn-quiet min-h-[52px]" disabled={name.trim().length < 2}>{saved ? "Saved" : "Save"}</button>
          </div>
        </form>
        <div className="flex items-center justify-between p-5">
          <span className="text-[13px] text-muted">Email</span>
          <span className="text-[15px]">{user?.email}</span>
        </div>
      </section>

      <button
        onClick={() => { demo.signOut(); router.push("/"); }}
        className="mt-6 w-full rounded-[20px] bg-white p-4 text-[17px] text-[#d13438] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      >
        Sign out
      </button>

      <section className="mt-14">
        <p className="eyebrow">Demo controls</p>
        <p className="mt-1 text-[14px] text-muted">For walking a client through the experience. Not part of the product.</p>
        <div className="mt-4 overflow-hidden rounded-[20px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {[
            {
              label: "Jump to the final module",
              hint: "Completes modules 1–6 so you can try the final assessment and certificate.",
              run: () => {
                const mods = course.modules.slice(0, -1);
                const last = course.modules.at(-1)!;
                demo.fastForward(
                  [...mods.flatMap((m) => m.lessons.map((l) => l.id)), ...last.lessons.map((l) => l.id)],
                  mods.flatMap((m) => (m.quiz ? [m.quiz.id] : [])),
                );
                router.push(`/learn/${course.slug}`);
              },
            },
            {
              label: "Jump to the middle",
              hint: "Completes modules 1–3.",
              run: () => {
                const mods = course.modules.slice(0, 3);
                demo.fastForward(mods.flatMap((m) => m.lessons.map((l) => l.id)), mods.flatMap((m) => (m.quiz ? [m.quiz.id] : [])));
                router.push(`/learn/${course.slug}`);
              },
            },
            { label: "Reset my progress", hint: "Start the course from the beginning.", run: () => demo.resetProgress() },
            { label: "Reset the whole demo", hint: "Clears purchases, sign-in and progress.", run: () => { demo.resetAll(); router.push("/"); } },
          ].map((a) => (
            <button key={a.label} onClick={a.run} className="block w-full border-b border-line p-5 text-left last:border-0 hover:bg-fill/50">
              <span className="block text-[15px] font-medium text-accent">{a.label}</span>
              <span className="block text-[13px] text-muted">{a.hint}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
