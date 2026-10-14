// Turns a paid session into a calendar event. Server only.
// Phase 2: the Paystack webhook calls confirmBooking() once the payment is
// verified. Until then only the dev route below uses it.

import { brand } from "../catalog.ts";
import { createEvent, busyTimes, googleCreds } from "./google.ts";
import { isSlotOpen } from "./slots.ts";

export type BookingInput = { topicId: string; slot: string; name: string; email: string; phone: string; notes: string; reference: string };

export type BookingResult =
  | { ok: true; meetUrl?: string; eventId?: string; onCalendar: boolean }
  | { ok: false; reason: "taken" | "invalid" | "calendar"; message: string };

export async function confirmBooking(b: BookingInput, now = new Date()): Promise<BookingResult> {
  const cfg = brand.session;
  const topic = cfg.topics.find((t) => t.id === b.topicId);
  if (!topic) return { ok: false, reason: "invalid", message: "Unknown session topic." };
  const creds = googleCreds();
  try {
    const busy = creds ? await busyTimes(creds, now, new Date(now.getTime() + (cfg.days + 2) * 86_400_000)) : [];
    if (!isSlotOpen(cfg, busy, now, b.slot)) return { ok: false, reason: "taken", message: "That time is no longer available." };
    if (!creds) return { ok: true, onCalendar: false };
    const ev = await createEvent(creds, {
      start: new Date(b.slot).toISOString(),
      minutes: cfg.minutes,
      summary: `${topic.title}: ${b.name}`,
      description: [`Session: ${topic.title}`, `Student: ${b.name}`, `Email: ${b.email}`, `Phone / WhatsApp: ${b.phone}`, `Payment ref: ${b.reference}`, "", b.notes ? `What they want to cover:\n${b.notes}` : ""].join("\n"),
      attendeeEmail: b.email,
      requestId: b.reference,
    });
    return { ok: true, onCalendar: true, meetUrl: ev.meetUrl, eventId: ev.eventId };
  } catch (e) {
    return { ok: false, reason: "calendar", message: e instanceof Error ? e.message : "Calendar error." };
  }
}
