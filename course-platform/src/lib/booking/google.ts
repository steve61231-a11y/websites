// Google Calendar, for the instructor's real availability and bookings.
// Server only. One-time setup is in docs/BOOKING-SETUP.md; it needs four
// environment variables. Without them, sessions are offered from the weekly
// hours alone and nothing is written to a calendar.

import type { Busy } from "./slots.ts";

type Creds = { clientId: string; clientSecret: string; refreshToken: string; calendarId: string };

export function googleCreds(): Creds | null {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN ?? "";
  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken, calendarId: process.env.GOOGLE_CALENDAR_ID || "primary" };
}

let cached: { token: string; expires: number } | null = null;

async function accessToken(c: Creds) {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: c.clientId, client_secret: c.clientSecret, refresh_token: c.refreshToken, grant_type: "refresh_token" }),
  });
  if (!res.ok) throw new Error(`Google sign-in failed (${res.status}). The refresh token may have been revoked.`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: body.access_token, expires: Date.now() + body.expires_in * 1000 };
  return cached.token;
}

const API = "https://www.googleapis.com/calendar/v3";

/** The times the instructor is already busy, across the calendar. */
export async function busyTimes(c: Creds, from: Date, to: Date): Promise<Busy[]> {
  const res = await fetch(`${API}/freeBusy`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken(c)}`, "Content-Type": "application/json" },
    body: JSON.stringify({ timeMin: from.toISOString(), timeMax: to.toISOString(), items: [{ id: c.calendarId }] }),
  });
  if (!res.ok) throw new Error(`Google Calendar free/busy failed (${res.status}).`);
  const body = (await res.json()) as { calendars?: Record<string, { busy?: Busy[] }> };
  return body.calendars?.[c.calendarId]?.busy ?? [];
}

export type NewEvent = { start: string; minutes: number; summary: string; description: string; attendeeEmail: string; requestId: string };

/** Puts the session on the calendar with a Google Meet link; Google emails the invite to the student. */
export async function createEvent(c: Creds, e: NewEvent) {
  const end = new Date(Date.parse(e.start) + e.minutes * 60_000).toISOString();
  const res = await fetch(`${API}/calendars/${encodeURIComponent(c.calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken(c)}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: e.summary,
      description: e.description,
      start: { dateTime: e.start },
      end: { dateTime: end },
      attendees: [{ email: e.attendeeEmail }],
      conferenceData: { createRequest: { requestId: e.requestId, conferenceSolutionKey: { type: "hangoutsMeet" } } },
      reminders: { useDefault: true },
    }),
  });
  if (!res.ok) throw new Error(`Google Calendar couldn't create the event (${res.status}).`);
  const body = (await res.json()) as { id: string; htmlLink?: string; hangoutLink?: string };
  return { eventId: body.id, calendarUrl: body.htmlLink, meetUrl: body.hangoutLink };
}
