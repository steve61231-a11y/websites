import { connection } from "next/server";
import { backendConfigured, env } from "@/lib/server/env";
import { allow, clientIp } from "@/lib/server/limit";
import { liveDeps } from "@/lib/server/services";
import { receiptFor, settle } from "@/lib/server/settle";
import { json, notConfigured } from "../../_http";

// GET /api/pay/status?reference=PRD_...  The page the student lands on after
// paying polls this. It asks Paystack directly if the webhook hasn't arrived
// yet, so the student never waits on a slow webhook. The reference is a long
// random code that only that student has.

export async function GET(request: Request) {
  await connection();
  if (!backendConfigured() || !env.paystackSecret()) return notConfigured();
  if (!allow(`status:${clientIp(request)}`, 90, 60_000)) return json(429, { error: "slow down" });
  const reference = new URL(request.url).searchParams.get("reference") ?? "";
  if (!/^PRD_[A-Za-z0-9]{8,40}$/.test(reference)) return json(400, { error: "bad reference" });

  try {
    const r = await settle(reference, liveDeps());
    if (r.status === "unknown") return json(404, { status: "unknown" });
    if (r.status !== "success" || !r.payment) return json(200, { status: r.status });
    const p = r.payment;
    return json(200, { status: "success", kind: p.kind, item: p.item, name: p.name, email: p.email, phone: (p.meta as { phone?: string }).phone ?? "", notes: (p.meta as { notes?: string }).notes ?? "", receipt: receiptFor(p) });
  } catch (e) {
    console.error("[pay/status]", e);
    return json(200, { status: "pending" }); // a hiccup: the page just asks again
  }
}
