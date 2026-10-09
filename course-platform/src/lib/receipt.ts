import { brand, formatPrice } from "./catalog";
import type { Course } from "./types";

// One receipt, used three ways: printed on screen after payment, sent as a
// plain email, and (Phase 3) built server-side from the verified Paystack
// transaction, never from what the browser says it paid.

export type Receipt = {
  number: string; // our receipt number, e.g. R-2026-000318
  reference: string; // Paystack transaction reference
  courseId: string;
  courseTitle: string;
  amount: number;
  currency: string;
  method: "mpesa" | "card";
  /** Last digits of the phone or card, for display only. */
  last4: string;
  name: string;
  email: string;
  paidAt: string; // ISO date
};

/** Demo receipt. In production every field comes from the Paystack webhook. */
export function demoReceipt(course: Course, p: { name: string; email: string; method: "mpesa" | "card"; contact: string }): Receipt {
  const seq = String(300 + Math.floor(Math.random() * 600)).padStart(6, "0");
  const ref = Array.from({ length: 10 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
  const digits = p.contact.replace(/\D/g, "");
  return {
    number: `R-${new Date().getFullYear()}-${seq}`,
    reference: `PSK_${ref}`,
    courseId: course.id,
    courseTitle: `${course.shortTitle}: ${course.title}`,
    amount: course.price,
    currency: course.currency,
    method: p.method,
    last4: p.method === "card" ? "4242" : digits.slice(-3),
    name: p.name,
    email: p.email,
    paidAt: new Date().toISOString(),
  };
}

export function paidWith(r: Receipt) {
  return r.method === "mpesa" ? `M-Pesa ···${r.last4}` : `Card ···${r.last4}`;
}

export function receiptDate(r: Receipt) {
  return new Date(r.paidAt).toLocaleString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** The receipt email: plain on purpose, so it reads well in every inbox. */
export function receiptEmail(r: Receipt) {
  const first = r.name.split(" ")[0] || "there";
  const total = formatPrice(r.amount, r.currency);
  const rows: [string, string][] = [
    ["Course", r.courseTitle],
    ["Amount", total],
    ["Paid with", paidWith(r)],
    ["Date", receiptDate(r)],
    ["Receipt", r.number],
    ["Reference", r.reference],
  ];
  const subject = `Your receipt from ${brand.organisation} (${r.number})`;
  const text = [
    `Hi ${first},`,
    "",
    `Thanks for your purchase. You paid ${total} for ${r.courseTitle}.`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "Your course access is in a separate email.",
    "",
    `${brand.organisation} · ${brand.email}`,
  ].join("\n");
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#111;font-size:15px;line-height:1.6;max-width:520px">
<p>Hi ${esc(first)},</p>
<p>Thanks for your purchase. You paid <strong>${esc(total)}</strong> for ${esc(r.courseTitle)}.</p>
<table style="border-collapse:collapse;width:100%;margin:16px 0">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#666;width:120px">${esc(k)}</td><td style="padding:6px 0">${esc(v)}</td></tr>`)
    .join("")}</table>
<p>Your course access is in a separate email.</p>
<p style="color:#666;font-size:13px">${esc(brand.organisation)} · ${esc(brand.email)}</p>
</div>`;
  return { subject, text, html, rows, first, total };
}
