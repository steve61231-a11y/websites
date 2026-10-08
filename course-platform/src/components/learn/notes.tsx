import type { Note } from "@/lib/types";
import { FadeIn } from "@/components/motion/reveal";

/** Lesson notes, typeset for reading under the video. */
export function Notes({ notes }: { notes: Note[] }) {
  return (
    <div className="space-y-8">
      {notes.map((n, i) => {
        switch (n.type) {
          case "lead":
            return (
              <p key={i} className="headline text-[clamp(22px,2.4vw,28px)] text-white">
                {n.text}
              </p>
            );
          case "heading":
            return (
              <h3 key={i} className="pt-6 font-[family-name:var(--font-display)] text-[13px] font-bold uppercase tracking-[0.22em] text-amber">
                {n.text}
              </h3>
            );
          case "paragraph":
            return (
              <p key={i} className="max-w-[64ch] text-[17px] leading-[1.7] text-ink-2">
                {n.text}
              </p>
            );
          case "list":
            return (
              <ul key={i} className="max-w-[64ch] space-y-3">
                {n.items.map((t) => (
                  <li key={t} className="flex gap-3 text-[17px] leading-[1.6] text-ink-2">
                    <span className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-amber" />
                    {t}
                  </li>
                ))}
              </ul>
            );
          case "cards":
            return (
              <div key={i} className="grid gap-3 sm:grid-cols-2">
                {n.items.map((c, k) => (
                  <FadeIn key={c.title} delay={k * 0.05} y={16}>
                    <div className="h-full rounded-[22px] bg-surface p-6 ring-1 ring-inset ring-white/[0.06]">
                      <p className="text-[18px] font-semibold tracking-[-0.01em] text-white">{c.title}</p>
                      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{c.body}</p>
                      {c.examples && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {c.examples.map((e) => (
                            <span key={e} className="rounded-full bg-white/[0.06] px-3 py-1 text-[12px] text-ink-2">
                              {e}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </FadeIn>
                ))}
              </div>
            );
          case "steps":
            return (
              <ol key={i} className="relative space-y-6 border-l border-white/10 pl-8">
                {n.items.map((s, k) => (
                  <li key={s.title} className="relative">
                    <span className="absolute -left-[45px] top-0 grid size-7 place-items-center rounded-full bg-black font-[family-name:var(--font-display)] text-[12px] font-bold text-amber ring-1 ring-amber/40">
                      {k + 1}
                    </span>
                    <p className="text-[18px] font-semibold tracking-[-0.01em] text-white">{s.title}</p>
                    <p className="mt-1 max-w-[60ch] text-[16px] leading-relaxed text-ink-2">{s.body}</p>
                  </li>
                ))}
              </ol>
            );
          case "callout":
            return (
              <div key={i} className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-amber/[0.14] to-transparent p-6 ring-1 ring-inset ring-amber/25">
                <p className="text-[17px] font-semibold text-white">{n.title}</p>
                <p className="mt-2 max-w-[60ch] text-[16px] leading-relaxed text-ink-2">{n.body}</p>
              </div>
            );
        }
      })}
    </div>
  );
}
