import { connection } from "next/server";
import { confirmBooking } from "@/lib/booking/confirm";

// POST /api/booking/create: DEV ONLY. Books a session without checking
// payment, so it is closed unless BOOKING_DEV_OPEN=1 (ignored in production
// unless BOOKING_DEV_OPEN_IN_PRODUCTION=1 too). The real flow runs
// confirmBooking() from the Paystack webhook after the payment is verified.

const str = (v: unknown, max: number) => (typeof v === "string" && v.trim().length > 0 && v.length <= max ? v.trim() : null);

export async function POST(request: Request) {
  await connection();
  const open = process.env.BOOKING_DEV_OPEN === "1" && (process.env.NODE_ENV !== "production" || process.env.BOOKING_DEV_OPEN_IN_PRODUCTION === "1");
  if (!open) return Response.json({ error: "closed" }, { status: 403 });
  if (request.headers.get("sec-fetch-site") === "cross-site") return Response.json({ error: "cross-site" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }
  const topicId = str(body.topicId, 40);
  const slot = str(body.slot, 40);
  const name = str(body.name, 80);
  const email = str(body.email, 120);
  const phone = str(body.phone, 40);
  if (!topicId || !slot || !name || !email || !phone || !/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "missing details" }, { status: 400 });

  const result = await confirmBooking({ topicId, slot, name, email, phone, notes: str(body.notes, 1000) ?? "", reference: `DEV_${Date.now().toString(36)}` });
  return Response.json(result, { status: result.ok ? 200 : result.reason === "taken" ? 409 : 502 });
}
