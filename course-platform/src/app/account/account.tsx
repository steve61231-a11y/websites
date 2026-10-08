"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { course } from "@/lib/catalog";
import { demo, useDemo } from "@/lib/demo-store";

export function Account() {
  const { user } = useDemo();
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);

  const jump = (count: number) => {
    const mods = course.modules.slice(0, count);
    const last = course.modules[count];
    demo.fastForward(
      [...mods.flatMap((m) => m.lessons.map((l) => l.id)), ...(last && count === course.modules.length - 1 ? last.lessons.map((l) => l.id) : [])],
      mods.flatMap((m) => (m.quiz ? [m.quiz.id] : [])),
    );
    router.push("/learn");
  };

  return (
    <div className="wrap max-w-[680px]">
      <h1 className="display text-[clamp(40px,6vw,64px)] text-white">Account</h1>

      <section className="panel mt-10 overflow-hidden">
        <form
          className="border-b border-white/[0.06] p-6"
          onSubmit={(e) => {
            e.preventDefault();
            demo.updateName(name.trim());
            setSaved(true);
            setTimeout(() => setSaved(false), 1600);
          }}
        >
          <label className="text-[13px] text-muted" htmlFor="acct-name">Name on your certificate</label>
          <div className="mt-2 flex gap-2">
            <input id="acct-name" className="field" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn btn-glass min-h-14 shrink-0" disabled={name.trim().length < 2}>{saved ? "Saved" : "Save"}</button>
          </div>
        </form>
        <div className="flex items-center justify-between gap-4 p-6">
          <span className="text-[13px] text-muted">Email</span>
          <span className="truncate text-[15px] text-white">{user?.email}</span>
        </div>
      </section>

      <button
        onClick={() => {
          demo.signOut();
          router.push("/");
        }}
        className="panel mt-4 w-full p-5 text-[16px] font-semibold text-danger"
      >
        Sign out
      </button>

      <section className="mt-16">
        <p className="eyebrow">Demo controls</p>
        <p className="mt-2 text-[14px] text-muted">For showing the client the whole journey. Not part of the product.</p>
        <div className="panel mt-5 overflow-hidden">
          {[
            { label: "Jump to Day 4", hint: "Completes the welcome and days 1–3.", run: () => jump(4) },
            { label: "Jump to the wrap-up", hint: "Completes days 1–7 so you can try the final assessment.", run: () => jump(course.modules.length - 1) },
            { label: "Reset my progress", hint: "Start the course from the beginning.", run: () => { demo.resetProgress(); router.push("/learn"); } },
            { label: "Reset the whole demo", hint: "Clears payment, sign-in and progress.", run: () => { demo.resetAll(); router.push("/"); } },
          ].map((a) => (
            <button key={a.label} onClick={a.run} className="block w-full border-b border-white/[0.06] p-5 text-left last:border-0 hover:bg-white/[0.03]">
              <span className="block text-[15px] font-semibold text-amber">{a.label}</span>
              <span className="mt-0.5 block text-[13px] text-muted">{a.hint}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
