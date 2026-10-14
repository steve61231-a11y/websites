import { connection } from "next/server";
import { brand } from "@/lib/catalog";
import { busyTimes, googleCreds } from "@/lib/booking/google";
import { generateSlots } from "@/lib/booking/slots";

// GET /api/booking/slots: the times a session can be booked, from the weekly
// hours minus what's already on the instructor's Google Calendar.

const HEADERS = { "Cache-Control": "private, max-age=20", "X-Content-Type-Options": "nosniff" };

export async function GET() {
  await connection();
  const cfg = brand.session;
  const now = new Date();
  const creds = googleCreds();
  try {
    const busy = creds ? await busyTimes(creds, now, new Date(now.getTime() + (cfg.days + 2) * 86_400_000)) : [];
    return Response.json(
      { slots: generateSlots(cfg, busy, now), source: creds ? "google" : "hours", timezone: cfg.timezone, minutes: cfg.minutes },
      { headers: HEADERS },
    );
  } catch (e) {
    // Never offer times we couldn't check against the calendar.
    console.error("[booking]", e);
    return Response.json({ error: "calendar unavailable" }, { status: 503, headers: HEADERS });
  }
}
