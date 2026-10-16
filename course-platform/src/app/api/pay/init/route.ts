import { randomBytes } from "node:crypto";
import { connection } from "next/server";
import { brand, getCourse } from "@/lib/catalog";
import { env, backendConfigured } from "@/lib/server/env";
import { allow, clientIp } from "@/lib/server/limit";
import { initializeTransaction } from "@/lib/server/paystack";
import { supabaseStore } from "@/lib/server/store";
import { crossSite, emailOk, json, notConfigured, readJson, str } from "../../_http";

// POST /api/pay/init {kind: "course" | "session", item, name, email, phone?, notes?}
// Starts a Paystack payment and returns the address to send the student to.
// The price is looked up here, never taken from the browser.

export async function POST(request: Request) {
  await connection();
  if (!backendConfigured() || !env.paystackSecret()) return notConfigured();
  if (crossSite(request)) return json(403, { error: "cross-site" });
  if (!allow(`init:${clientIp(request)}`, 12, 10 * 60_000)) return json(429, { error: "Too many attempts. Try again in a few minutes." });

  const body = await readJson(request);
  if (!body) return json(400, { error: "bad request" });
  const kind = body.kind === "course" || body.kind === "session" ? body.kind : null;
  const item = str(body.item, 60);
  const name = str(body.name, 80);
  const email = str(body.email, 120)?.toLowerCase() ?? null;
  if (!kind || !item || !name || !email || !emailOk(email)) return json(400, { error: "Please enter your name and a valid email." });

  let amount: number;
  let currency: string;
  let label: string;
  if (kind === "course") {
    const course = getCourse(item);
    if (!course || course.status !== "published") return json(404, { error: "That course isn't available." });
    ({ price: amount, currency } = course);
    label = course.title;
  } else {
    const topic = brand.session.topics.find((t) => t.id === item);
    if (!topic) return json(404, { error: "That session isn't available." });
    ({ price: amount } = topic);
    currency = brand.session.currency;
    label = topic.title;
  }

  const reference = `PRD_${randomBytes(9).toString("base64url").replace(/[-_]/g, "x")}`;
  const meta = kind === "session" ? { phone: str(body.phone, 40) ?? "", notes: str(body.notes, 1500) ?? "" } : {};
  try {
    await supabaseStore().insertPayment({ reference, kind, item, email, name, amount, currency, meta });
    const t = await initializeTransaction(env.paystackSecret(), {
      email,
      amountKes: amount,
      currency,
      reference,
      callbackUrl: `${env.siteUrl()}/pay/return?reference=${encodeURIComponent(reference)}`,
      metadata: { kind, item, label, name },
    });
    return json(200, { url: t.authorizationUrl, reference });
  } catch (e) {
    console.error("[pay/init]", e);
    return json(502, { error: "We couldn't start the payment. Please try again." });
  }
}
