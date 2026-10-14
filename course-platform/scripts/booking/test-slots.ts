// node scripts/booking/test-slots.ts
import assert from "node:assert/strict";
import { buildIcs } from "../../src/lib/booking/ics.ts";
import { dayKey, generateSlots, groupByDay, isSlotOpen } from "../../src/lib/booking/slots.ts";
import type { SessionConfig } from "../../src/lib/types.ts";

const cfg: SessionConfig = {
  minutes: 60, price: 1, currency: "KES", topics: [], timezone: "Africa/Nairobi", utcOffsetHours: 3,
  hours: { 1: [9, 17], 2: [9, 17], 3: [9, 17], 4: [9, 17], 5: [9, 17], 6: [10, 14] }, noticeHours: 24, days: 14,
};
// Mon 12 Oct 2026, 08:00 Nairobi = 05:00 UTC
const now = new Date("2026-10-12T05:00:00Z");
let ok = 0;
const t = (name: string, fn: () => void) => { fn(); ok++; console.log("ok  ", name); };

t("nothing sooner than the notice period", () => {
  const s = generateSlots(cfg, [], now);
  assert.ok(Date.parse(s[0]) >= now.getTime() + 24 * 3_600_000);
  assert.equal(s[0], "2026-10-13T06:00:00.000Z"); // Tue 09:00 Nairobi
});
t("weekdays 9-17 give 8 one-hour slots, Saturday 10-14 gives 4, Sunday none", () => {
  const days = groupByDay(generateSlots(cfg, [], now), cfg.timezone);
  const byKey = Object.fromEntries(days.map((d) => [d.key, d.slots.length]));
  assert.equal(byKey["2026-10-14"], 8); // Wed
  assert.equal(byKey["2026-10-17"], 4); // Sat
  assert.equal(byKey["2026-10-18"], undefined); // Sun
});
t("the last slot of a day starts an hour before closing", () => {
  const wed = groupByDay(generateSlots(cfg, [], now), cfg.timezone).find((d) => d.key === "2026-10-14")!;
  assert.equal(wed.slots.at(-1), "2026-10-14T13:00:00.000Z"); // 16:00 Nairobi
});
t("a busy period removes every slot it touches", () => {
  const busy = [{ start: "2026-10-14T07:30:00Z", end: "2026-10-14T08:30:00Z" }]; // 10:30-11:30 Nairobi
  const wed = groupByDay(generateSlots(cfg, busy, now), cfg.timezone).find((d) => d.key === "2026-10-14")!;
  assert.equal(wed.slots.length, 6); // 10:00 and 11:00 are gone
  assert.ok(!wed.slots.includes("2026-10-14T07:00:00.000Z") && !wed.slots.includes("2026-10-14T08:00:00.000Z"));
});
t("a busy period that only touches an edge leaves the neighbour free", () => {
  const busy = [{ start: "2026-10-14T07:00:00Z", end: "2026-10-14T08:00:00Z" }];
  const wed = groupByDay(generateSlots(cfg, busy, now), cfg.timezone).find((d) => d.key === "2026-10-14")!;
  assert.equal(wed.slots.length, 7);
  assert.ok(wed.slots.includes("2026-10-14T06:00:00.000Z") && wed.slots.includes("2026-10-14T08:00:00.000Z"));
});
t("isSlotOpen agrees, and rejects off-grid and past times", () => {
  assert.ok(isSlotOpen(cfg, [], now, "2026-10-14T06:00:00.000Z"));
  assert.ok(!isSlotOpen(cfg, [], now, "2026-10-14T06:30:00.000Z"));
  assert.ok(!isSlotOpen(cfg, [], now, "2026-10-12T06:00:00.000Z"));
  assert.ok(!isSlotOpen(cfg, [], now, "nonsense"));
});
t("late-evening UTC still lands on the right Nairobi day", () => {
  const late = new Date("2026-10-12T22:30:00Z"); // 01:30 Tue in Nairobi
  assert.equal(dayKey("2026-10-12T22:30:00Z", cfg.timezone), "2026-10-13");
  const s = generateSlots(cfg, [], late);
  assert.equal(s[0], "2026-10-14T06:00:00.000Z"); // Wed 09:00, after the 24 h notice
});
t("the calendar file has the essentials", () => {
  const ics = buildIcs({ uid: "x@y", start: "2026-10-14T06:00:00.000Z", minutes: 60, summary: "A, B", description: "line1\nline2" });
  assert.match(ics, /DTSTART:20261014T060000Z/);
  assert.match(ics, /DTEND:20261014T070000Z/);
  assert.match(ics, /SUMMARY:A\\, B/);
  assert.match(ics, /DESCRIPTION:line1\\nline2/);
});
console.log(`\n${ok} tests passed`);
