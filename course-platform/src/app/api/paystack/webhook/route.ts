import { connection } from "next/server";
import { env, backendConfigured } from "@/lib/server/env";
import { verifySignature } from "@/lib/server/paystack";
import { liveDeps } from "@/lib/server/services";
import { settle } from "@/lib/server/settle";
import { json, notConfigured } from "../../_http";

// POST /api/paystack/webhook: Paystack tells us a payment happened.
// Set this address in the Paystack dashboard (Settings → API Keys & Webhooks).
// We trust nothing in the body: the signature must match, then settle()
// asks Paystack itself whether the payment is real and for how much.

export async function POST(request: Request) {
  await connection();
  if (!backendConfigured() || !env.paystackSecret()) return notConfigured();
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-paystack-signature"), env.paystackSecret())) return json(401, { error: "bad signature" });

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return json(400, { error: "bad json" });
  }
  // Only successful charges matter. Everything else is acknowledged and ignored.
  if (event.event !== "charge.success" || !event.data?.reference) return json(200, { ok: true, ignored: true });

  try {
    const result = await settle(event.data.reference, liveDeps());
    return json(200, { ok: true, status: result.status });
  } catch (e) {
    console.error("[paystack/webhook]", e);
    return json(500, { error: "try again" }); // Paystack retries; every step is safe to repeat
  }
}
