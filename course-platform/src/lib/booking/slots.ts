// The maths behind session booking. Pure: no network, no clock of its own.
// Times travel as UTC ISO strings; working hours are in the school's time zone
// (a fixed UTC offset, which suits Nairobi). Used by the browser (to show
// times when the server can't be reached) and by the server (to check a slot
// is still free before it goes on the calendar).

import type { SessionConfig } from "../types.ts";

export type Busy = { start: string; end: string };

const HOUR = 3_600_000;
const MIN = 60_000;

/** Every bookable start time in the next `days` days, as ISO strings, soonest first. */
export function generateSlots(cfg: SessionConfig, busy: Busy[], now: Date): string[] {
  const offset = cfg.utcOffsetHours * HOUR;
  const earliest = now.getTime() + cfg.noticeHours * HOUR;
  const busyMs = busy.map((b) => [Date.parse(b.start), Date.parse(b.end)] as const).filter(([s, e]) => Number.isFinite(s) && Number.isFinite(e));
  const local = new Date(now.getTime() + offset); // "wall clock" day in the school's zone, read with the UTC getters
  const out: string[] = [];

  for (let i = 0; i <= cfg.days; i++) {
    const day = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + i);
    const hours = cfg.hours[new Date(day).getUTCDay()];
    if (!hours) continue;
    const dayStart = day - offset; // local midnight, in real UTC ms
    for (let m = hours[0] * 60; m + cfg.minutes <= hours[1] * 60; m += cfg.minutes) {
      const start = dayStart + m * MIN;
      const end = start + cfg.minutes * MIN;
      if (start < earliest) continue;
      if (busyMs.some(([s, e]) => s < end && e > start)) continue;
      out.push(new Date(start).toISOString());
    }
  }
  return out;
}

/** Is this exact start time still bookable? */
export function isSlotOpen(cfg: SessionConfig, busy: Busy[], now: Date, startIso: string): boolean {
  const t = Date.parse(startIso);
  if (!Number.isFinite(t)) return false;
  return generateSlots(cfg, busy, now).some((s) => Date.parse(s) === t);
}

/** The date a slot falls on in the school's time zone, "2026-10-15". */
export function dayKey(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

/** Slots grouped by local day, in order. */
export function groupByDay(slots: string[], timezone: string) {
  const days: { key: string; slots: string[] }[] = [];
  for (const s of slots) {
    const key = dayKey(s, timezone);
    const last = days[days.length - 1];
    if (last?.key === key) last.slots.push(s);
    else days.push({ key, slots: [s] });
  }
  return days;
}
