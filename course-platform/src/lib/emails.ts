import { brand, formatPrice } from "./catalog";

// The emails we send besides the receipt (src/lib/receipt.ts) and the
// certificate (src/lib/certificate-email.ts). Plain on purpose.

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const first = (name: string) => name.trim().split(/\s+/)[0] || "there";

function shell(body: string) {
  return `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#111;font-size:15px;line-height:1.6;max-width:520px">${body}
<p style="color:#666;font-size:13px;margin-top:28px">${esc(brand.organisation)} · ${esc(brand.email)}</p></div>`;
}

const button = (href: string, label: string) =>
  `<p><a href="${esc(href)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">${esc(label)}</a></p>`;

/** After a course payment: how to get in. There is no password; they sign in with a one-time code. */
export function accessEmail(p: { name: string; email: string; signInUrl: string; courseTitle: string }) {
  const subject = `Your access to THE PROD is ready`;
  const text = [
    `Hi ${first(p.name)},`,
    "",
    `Your payment is confirmed and ${p.courseTitle} is ready.`,
    `Sign in with ${p.email}. We'll send you a one-time code, so there's no password to remember.`,
    "",
    `Start here: ${p.signInUrl}`,
    "",
    `${brand.organisation} · ${brand.email}`,
  ].join("\n");
  const html = shell(
    `<p>Hi ${esc(first(p.name))},</p><p>Your payment is confirmed and <strong>${esc(p.courseTitle)}</strong> is ready.</p>
<p>Sign in with <strong>${esc(p.email)}</strong>. We'll send you a one-time code, so there's no password to remember.</p>${button(p.signInUrl, "Start learning")}`,
  );
  return { subject, text, html };
}

/** After a 1:1 session payment: the link to pick a time (the calendar is Duncan's Cal.com). */
export function sessionEmail(p: { name: string; topic: string; amount: number; currency: string; bookingUrl: string }) {
  const subject = `Pick your time: ${p.topic}`;
  const price = formatPrice(p.amount, p.currency);
  const text = [
    `Hi ${first(p.name)},`,
    "",
    `Thanks for booking "${p.topic}" (${price}). One last step: choose your day and time here:`,
    p.bookingUrl || `(We'll send you the calendar link shortly.)`,
    "",
    `You'll get a calendar invite with the video-call link as soon as you've chosen.`,
    "",
    `${brand.organisation} · ${brand.email}`,
  ].join("\n");
  const html = shell(
    `<p>Hi ${esc(first(p.name))},</p><p>Thanks for booking <strong>${esc(p.topic)}</strong> (${esc(price)}). One last step: choose your day and time.</p>${
      p.bookingUrl ? button(p.bookingUrl, "Pick your time") : `<p>We'll send you the calendar link shortly.</p>`
    }<p>You'll get a calendar invite with the video-call link as soon as you've chosen.</p>`,
  );
  return { subject, text, html };
}

/** A short note to the school owner for every purchase and booking. */
export function ownerNote(p: { kind: "course" | "session"; name: string; email: string; item: string; amount: number; currency: string; phone?: string }) {
  const price = formatPrice(p.amount, p.currency);
  const subject = p.kind === "course" ? `New student: ${p.name}` : `New paid session: ${p.name}`;
  const lines = [`${p.kind === "course" ? "Course" : "Session"}: ${p.item}`, `Paid: ${price}`, `Name: ${p.name}`, `Email: ${p.email}`, ...(p.phone ? [`Phone: ${p.phone}`] : [])];
  return { subject, text: lines.join("\n"), html: shell(lines.map((l) => `<div>${esc(l)}</div>`).join("")) };
}
