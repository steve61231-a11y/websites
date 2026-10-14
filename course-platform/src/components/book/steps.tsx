"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft } from "@/components/icons";
import { buildIcs } from "@/lib/booking/ics";
import { generateSlots, groupByDay } from "@/lib/booking/slots";
import { brand } from "@/lib/catalog";
import type { SessionTopic } from "@/lib/types";

const TZ = brand.session.timezone;
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...o }).format(new Date(iso));

export const fmtTime = (iso: string) => fmt(iso, { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s?([ap])m/i, (_m, x: string) => ` ${x.toUpperCase()}M`);
export const fmtDay = (iso: string) => fmt(iso, { weekday: "long", day: "numeric", month: "long" });
export const fmtWhen = (iso: string) => `${fmt(iso, { weekday: "short", day: "numeric", month: "short" })}, ${fmtTime(iso)} (Nairobi)`;

type Loaded = { slots: string[]; state: "loading" | "ready" | "error" };

/** Open times from the server (which checks the instructor's Google Calendar). If the server can't be reached at all, falls back to the weekly hours. */
function useSlots(attempt: number): Loaded {
  const [data, setData] = useState<Loaded>({ slots: [], state: "loading" });
  useEffect(() => {
    let off = false;
    fetch("/api/booking/slots")
      .then(async (r) => {
        if (r.status === 503) throw new Error("calendar");
        if (!r.ok) throw new Error("server");
        return (await r.json()) as { slots: string[] };
      })
      .then((d) => !off && setData({ slots: d.slots, state: "ready" }))
      .catch((e: Error) => {
        if (off) return;
        if (e.message === "calendar") setData({ slots: [], state: "error" });
        else setData({ slots: generateSlots(brand.session, [], new Date()), state: "ready" });
      });
    return () => {
      off = true;
    };
  }, [attempt]);
  return data;
}

export function TopicStep({ onPick }: { onPick: (t: SessionTopic) => void }) {
  return (
    <div>
      <p className="eyebrow">Step 1 of 4</p>
      <h1 className="headline mt-3 text-[38px] text-white">What do you want to work on?</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-muted">One hour, one on one with Duncan. Pick the session that fits.</p>
      <div className="mt-8 space-y-3">
        {brand.session.topics.map((t) => (
          <button key={t.id} onClick={() => onPick(t)} className="group w-full rounded-2xl bg-white/[0.06] p-5 text-left ring-1 ring-inset ring-white/10 transition-[background-color,transform] duration-300 hover:bg-white/[0.1] active:scale-[0.985]">
            <span className="block text-[17px] font-semibold text-white">{t.title}</span>
            <span className="mt-1 block text-[14px] leading-snug text-muted">{t.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function TimeStep({ topic, slot, onPick, onBack, onContinue }: { topic: SessionTopic; slot: string | null; onPick: (iso: string) => void; onBack: () => void; onContinue: () => void }) {
  const [attempt, setAttempt] = useState(0);
  const { slots, state } = useSlots(attempt);
  const days = useMemo(() => groupByDay(slots, TZ), [slots]);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const current = days.find((d) => d.key === (dayKey ?? (slot ? days.find((x) => x.slots.includes(slot))?.key : undefined) ?? days[0]?.key));

  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1 text-[14px] text-muted hover:text-white">
        <ChevronLeft size={16} /> {topic.title}
      </button>
      <p className="eyebrow mt-6">Step 2 of 4</p>
      <h1 className="headline mt-3 text-[38px] text-white">Pick a time.</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        {brand.session.minutes} minutes, online. Times are in Nairobi time (EAT) and come straight from Duncan&apos;s calendar.
      </p>

      {state === "loading" && (
        <div className="mt-8 space-y-4" aria-busy>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[76px] w-[64px] shrink-0 animate-pulse rounded-2xl bg-white/[0.06]" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-2xl bg-white/[0.06]" />
            ))}
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="mt-8 rounded-2xl bg-white/[0.06] p-5 text-[15px] text-ink-2 ring-1 ring-inset ring-white/10">
          We couldn&apos;t load Duncan&apos;s calendar just now.
          <button onClick={() => setAttempt((n) => n + 1)} className="mt-3 block font-semibold text-amber">Try again</button>
        </div>
      )}

      {state === "ready" && days.length === 0 && (
        <p className="mt-8 rounded-2xl bg-white/[0.06] p-5 text-[15px] text-ink-2 ring-1 ring-inset ring-white/10">
          No times are open right now. Message us on WhatsApp ({brand.whatsapp}) and we&apos;ll find you one.
        </p>
      )}

      {state === "ready" && current && (
        <>
          <div className="-mx-6 mt-8 flex snap-x gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Day">
            {days.map((d) => {
              const on = d.key === current.key;
              return (
                <button
                  key={d.key}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setDayKey(d.key)}
                  className={`relative w-[64px] shrink-0 snap-start rounded-2xl px-2 py-3 text-center transition-colors duration-300 ${on ? "" : "bg-white/[0.06] hover:bg-white/[0.1]"}`}
                >
                  {on && <motion.span layoutId="day-chip" className="absolute inset-0 rounded-2xl bg-white" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <span className={`relative block text-[11px] font-semibold uppercase tracking-wide ${on ? "text-black/60" : "text-muted"}`}>{fmt(d.slots[0], { weekday: "short" })}</span>
                  <span className={`relative block text-[22px] font-bold leading-tight tabular-nums ${on ? "text-black" : "text-white"}`}>{fmt(d.slots[0], { day: "numeric" })}</span>
                  <span className={`relative block text-[11px] ${on ? "text-black/60" : "text-muted"}`}>{fmt(d.slots[0], { month: "short" })}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-[14px] font-medium text-ink-2">{fmtDay(current.slots[0])}</p>
          <div className="mt-3 grid grid-cols-3 gap-2" role="listbox" aria-label="Time">
            {current.slots.map((s) => {
              const on = s === slot;
              return (
                <button
                  key={s}
                  role="option"
                  aria-selected={on}
                  onClick={() => onPick(s)}
                  className={`min-h-12 rounded-2xl text-[15px] font-semibold tabular-nums ring-1 ring-inset transition-[background-color,color,transform] duration-300 active:scale-[0.96] ${
                    on ? "bg-amber text-on-amber ring-transparent" : "bg-white/[0.06] text-white ring-white/10 hover:bg-white/[0.1]"
                  }`}
                >
                  {fmtTime(s)}
                </button>
              );
            })}
          </div>
        </>
      )}

      <button onClick={onContinue} disabled={!slot} className="btn btn-white btn-lg mt-8 w-full">
        {slot ? `Continue · ${fmtWhen(slot).split(" (")[0]}` : "Choose a time"}
      </button>
    </div>
  );
}

/** After payment: when it is, and a calendar file to keep. */
export function BookedCard({ topic, slot, email, receiptNumber }: { topic: string; slot: string; email: string; receiptNumber: string }) {
  function download() {
    const ics = buildIcs({
      uid: `${receiptNumber}@the-prod`,
      start: slot,
      minutes: brand.session.minutes,
      summary: `${topic} with Duncan Mutavi`,
      description: `1:1 session booked on THE PROD (${receiptNumber}). The video-call link is in your email invite.`,
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "the-prod-session.ics" });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="w-full">
      <h1 className="headline text-[26px] text-white">You&apos;re booked.</h1>
      <div className="mx-auto mt-5 max-w-xs rounded-2xl bg-white/[0.06] p-5 text-left ring-1 ring-inset ring-white/10">
        <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-amber">
          <Check size={14} strokeWidth={3} /> Confirmed
        </p>
        <p className="mt-3 text-[17px] font-semibold text-white">{topic}</p>
        <p className="mt-1 text-[15px] text-ink-2">{fmtDay(slot)}</p>
        <p className="text-[15px] text-ink-2">{fmtTime(slot)} · {brand.session.minutes} min · Nairobi time</p>
      </div>
      <p className="mx-auto mt-4 max-w-xs text-[14px] leading-relaxed text-muted">
        A calendar invite with the video-call link is on its way to <span className="text-white">{email}</span>, along with your receipt.
      </p>
      <button onClick={download} className="btn btn-white btn-lg mt-6 w-full">Add to my calendar</button>
    </div>
  );
}
