import { brand, getCourse } from "../catalog.ts";
import { calBookingUrl } from "../booking/cal.ts";
import { accessEmail, ownerNote, sessionEmail } from "../emails.ts";
import { receiptEmail, type Receipt } from "../receipt.ts";
import type { Mail } from "./email.ts";
import { toSubunits, type Verified } from "./paystack.ts";
import type { PaymentRow, PaymentStatus, Store } from "./store.ts";

// What happens when a payment comes in: check it with Paystack, record it
// once, then give the student their access and send the emails. Called from
// the Paystack webhook AND from the page that polls for the result, so a
// slow or missed webhook never leaves a paying student waiting. Every step is
// safe to repeat.

export type Deps = {
  store: Store;
  verify: (reference: string) => Promise<Verified>;
  mail: (m: Mail) => Promise<unknown>;
  siteUrl: string;
  /** Also email this address a short note about each purchase. */
  notify?: string;
};

export type Settled = { status: "unknown" | "pending" | "success" | "failed"; payment: PaymentRow | null };

export async function settle(reference: string, deps: Deps): Promise<Settled> {
  const { store } = deps;
  let p = await store.getPayment(reference);
  if (!p) return { status: "unknown", payment: null };

  if (p.status === "pending") {
    const v = await deps.verify(reference);
    if (v.status === "success") {
      // Never trust the amount from the browser or the webhook body: it must match what we asked for.
      if (v.amount !== toSubunits(p.amount) || v.currency !== p.currency) {
        console.error(`[pay] ${reference}: paid ${v.amount} ${v.currency}, expected ${toSubunits(p.amount)} ${p.currency}`);
        await store.setStatus(reference, "failed");
        return { status: "failed", payment: await store.getPayment(reference) };
      }
      await store.markSuccess(reference, { paystackId: v.id, channel: v.channel, paidAt: v.paidAt ?? new Date().toISOString() });
      p = (await store.getPayment(reference)) ?? p;
    } else if (v.status === "failed" || v.status === "abandoned" || v.status === "reversed") {
      await store.setStatus(reference, (v.status === "reversed" ? "failed" : v.status) as PaymentStatus);
      return { status: "failed", payment: await store.getPayment(reference) };
    } else {
      return { status: "pending", payment: p };
    }
  }

  if (p.status !== "success") return { status: "failed", payment: p };
  await fulfil(p, deps);
  return { status: "success", payment: (await store.getPayment(reference)) ?? p };
}

/** The receipt for a paid order, built only from our own verified record. */
export function receiptFor(p: PaymentRow): Receipt {
  const course = p.kind === "course" ? getCourse(p.item) : undefined;
  const topic = p.kind === "session" ? brand.session.topics.find((t) => t.id === p.item) : undefined;
  const when = new Date(p.paid_at ?? p.created_at);
  return {
    number: `R-${when.getUTCFullYear()}-${String(p.seq).padStart(6, "0")}`,
    reference: p.reference,
    courseId: p.kind === "session" ? "session" : (course?.id ?? p.item),
    courseTitle: p.kind === "session" ? (topic?.title ?? "1:1 session") : course ? `${course.shortTitle}: ${course.title}` : p.item,
    amount: p.amount,
    currency: p.currency,
    method: p.channel === "card" ? "card" : "mpesa",
    last4: "",
    name: p.name,
    email: p.email,
    paidAt: when.toISOString(),
  };
}

async function fulfil(p: PaymentRow, deps: Deps) {
  const { store } = deps;
  if (!(await store.claim(p.reference))) return; // already done, or another request is doing it

  const meta = p.meta as { phone?: string; notes?: string };
  const receipt = receiptFor(p);
  const quiet = async (m: Mail) => {
    try {
      await deps.mail(m);
    } catch (e) {
      console.error(`[mail] "${m.subject}" to ${m.to} failed:`, e); // access is granted regardless
    }
  };

  let userId: string | null = null;
  if (p.kind === "course") {
    const course = getCourse(p.item);
    if (!course) throw new Error(`payment ${p.reference} is for unknown course "${p.item}"`);
    userId = await store.ensureUser(p.email, p.name);
    await store.grantEnrollment(userId, course.slug, p.id);
    const r = receiptEmail(receipt);
    await quiet({ to: p.email, subject: r.subject, html: r.html, text: r.text });
    const a = accessEmail({ name: p.name, email: p.email, courseTitle: receipt.courseTitle, signInUrl: `${deps.siteUrl}/sign-in?email=${encodeURIComponent(p.email)}` });
    await quiet({ to: p.email, ...a });
  } else {
    const topic = brand.session.topics.find((t) => t.id === p.item);
    if (!topic) throw new Error(`payment ${p.reference} is for unknown session topic "${p.item}"`);
    userId = await store.ensureUser(p.email, p.name);
    await store.createBooking({ paymentId: p.id, userId, topic: topic.title, name: p.name, email: p.email, phone: meta.phone ?? "", notes: meta.notes ?? "" });
    const r = receiptEmail(receipt);
    await quiet({ to: p.email, subject: r.subject, html: r.html, text: r.text });
    const s = sessionEmail({ name: p.name, topic: topic.title, amount: p.amount, currency: p.currency, bookingUrl: calBookingUrl({ url: brand.session.calUrl, name: p.name, email: p.email, topic: topic.title, notes: meta.notes ?? "" }) });
    await quiet({ to: p.email, ...s });
  }

  if (deps.notify) {
    const n = ownerNote({ kind: p.kind, name: p.name, email: p.email, item: receipt.courseTitle, amount: p.amount, currency: p.currency, phone: meta.phone });
    await quiet({ to: deps.notify, ...n });
  }
  await store.markFulfilled(p.reference, userId);
}
